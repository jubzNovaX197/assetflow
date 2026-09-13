// components/layout/header.tsx

"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { MobileNav } from "@/components/layout/mobile-nav";

type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "assetflow-theme";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;

  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  const shouldUseDark =
    mode === "dark" || (mode === "system" && systemPrefersDark);

  root.classList.toggle("dark", shouldUseDark);
}

interface HeaderProps {
  title?: string;
}

export function Header({ title = "Dashboard" }: HeaderProps) {
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(
      THEME_STORAGE_KEY
    ) as ThemeMode | null;

    const initial = stored ?? "system";

    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (theme !== "system") return;

    const media = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const listener = () => applyTheme("system");

    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [theme]);

  function handleThemeChange(mode: ThemeMode) {
    setTheme(mode);
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    applyTheme(mode);
  }

  const ThemeIcon =
    theme === "light"
      ? Sun
      : theme === "dark"
        ? Moon
        : Monitor;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <div className="flex items-center gap-2">
        <MobileNav />

        <h1 className="text-base font-semibold tracking-tight text-foreground md:text-lg">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground"
            aria-label="Toggle theme"
          >
            {mounted ? (
              <ThemeIcon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleThemeChange("light")}
            >
              <Sun className="mr-2 h-4 w-4" />
              Light
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleThemeChange("dark")}
            >
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleThemeChange("system")}
            >
              <Monitor className="mr-2 h-4 w-4" />
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}