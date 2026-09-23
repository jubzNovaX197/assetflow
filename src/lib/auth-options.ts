import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { db } from "@/prisma/db";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Assquere Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "name@company.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;

        /*
         * Authentication is performed against UserAccount,
         * not directly against Employee.
         */
        const accounts = await db.orm.public.UserAccount.where({
          email,
        }).all();

       const account = accounts[0];

console.log(
  "[AUTH] Account lookup:",
  account
    ? {
        id: account.id,
        email: account.email,
        role: account.role,
        status: account.status,
      }
    : "NO ACCOUNT FOUND",
);

if (!account) {
  return null;
}

        /*
         * Block inactive and suspended accounts.
         */
        if (
          account.status === "INACTIVE" ||
          account.status === "SUSPENDED"
        ) {
          return null;
        }

        /*
         * Handle temporary account lock.
         */
        if (account.status === "LOCKED" && account.lockedUntil) {
          const lockedUntil = new Date(account.lockedUntil);
          const now = new Date();

          if (lockedUntil > now) {
            return null;
          }

          /*
           * Lock period has expired.
           * Restore the account to ACTIVE.
           */
          await db.orm.public.UserAccount.where({
            id: account.id,
          }).update({
            status: "ACTIVE",
            failedLoginAttempts: 0,
            lockedUntil: null,
          });
        }

        /*
         * Secure password verification.
         *
         * The database contains only the bcrypt hash.
         */
        const passwordValid = await bcrypt.compare(
          password,
          account.passwordHash,
        );
        console.log("[AUTH] Password valid:", passwordValid);
        console.log("[AUTH] Passed password check.");

        const requestHeaders = request?.headers;

const ipAddress =
  requestHeaders?.["x-forwarded-for"] ??
  requestHeaders?.["x-real-ip"] ??
  null;

const userAgent =
  requestHeaders?.["user-agent"] ?? null;

        /*
         * Failed authentication.
         */
        if (!passwordValid) {
          const failedAttempts = account.failedLoginAttempts + 1;

          /*
           * Lock the account after the maximum number
           * of consecutive failed attempts.
           */
          if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
            const lockedUntil = new Date(
              Date.now() + LOCK_DURATION_MINUTES * 60 * 1000,
            ).toISOString();

            await db.orm.public.UserAccount.where({
              id: account.id,
            }).update({
              status: "LOCKED",
              failedLoginAttempts: failedAttempts,
              lastFailedLoginAt: new Date().toISOString(),
              lockedUntil,
            });

            await db.orm.public.AuthAuditLog.create({
              accountId: account.id,
              action: "ACCOUNT_LOCKED",
              email: account.email,
              ipAddress,
              userAgent,
              metadata: {
                reason: "Maximum failed login attempts exceeded",
                failedAttempts,
              },
            });

            return null;
          }

          /*
           * Record failed login attempt.
           */
          await db.orm.public.UserAccount.where({
            id: account.id,
          }).update({
            failedLoginAttempts: failedAttempts,
            lastFailedLoginAt: new Date().toISOString(),
          });

          await db.orm.public.AuthAuditLog.create({
            accountId: account.id,
            action: "LOGIN_FAILED",
            email: account.email,
            ipAddress,
            userAgent,
            metadata: {
              failedAttempts,
            },
          });

          return null;
        }

        /*
         * Successful authentication.
         */
       console.log("[AUTH] Updating account...");

await db.orm.public.UserAccount.where({
  id: account.id,
}).update({
  status: "ACTIVE",
  failedLoginAttempts: 0,
  lockedUntil: null,
  lastLoginAt: new Date().toISOString(),
});

console.log("[AUTH] Account update successful.");

console.log("[AUTH] Creating login audit record...");

await db.orm.public.AuthAuditLog.create({
  accountId: account.id,
  action: "LOGIN_SUCCESS",
  email: account.email,
  ipAddress,
  userAgent,
  metadata: {
    role: account.role,
    employeeId: account.employeeId,
  },
});

console.log("[AUTH] Login audit record created.");
        /*
         * The returned object is passed to the JWT callback.
         */
       const authenticatedUser = {
  id: account.id,
  email: account.email,
  name: account.employeeId,
  role: account.role,
  employeeId: account.employeeId,
};

console.log("[AUTH] Returning user:", {
  id: authenticatedUser.id,
  email: authenticatedUser.email,
  name: authenticatedUser.name,
  role: authenticatedUser.role,
  employeeId: authenticatedUser.employeeId,
});

return authenticatedUser;
      },
    }),
  ],

  /*
   * JWT-based session.
   *
   * Eight hours is appropriate for a normal working session.
   */
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },

  /*
   * Dedicated Assquere login page.
   */
  pages: {
    signIn: "/login",
  },

  callbacks: {
    /*
     * Persist authorization information inside
     * the encrypted/signed NextAuth JWT.
     */
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.employeeId = user.employeeId;
      }

      return token;
    },

    /*
     * Expose authorization information to the application.
     */
    async session({ session, token }) {
  if (session.user) {
    session.user.id = token.sub ?? "";

    if (token.role) {
      session.user.role = token.role;
    }

    if (token.employeeId) {
      session.user.employeeId = token.employeeId;
    }
  }

  return session;
},
  },

  debug: process.env.NODE_ENV === "development",
};