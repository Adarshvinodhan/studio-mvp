import { AppShellClient } from "@/components/app-shell-client";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShellClient>{children}</AppShellClient>;
}
