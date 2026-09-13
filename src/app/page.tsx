// app/page.tsx
import { AppShell } from "@/components/layout/app-shell";

export default function Home() {
  return (
    <AppShell title="Dashboard">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome to AssetFlow
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          This is the application shell for AssetFlow, your enterprise asset
          lifecycle and custody management system. Dashboard widgets,
          reporting, and live data will be added here.
        </p>
      </div>
    </AppShell>
  );
}