"use client";

import { AppShell } from "@/components/app-shell";

export function AppShellClient({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
