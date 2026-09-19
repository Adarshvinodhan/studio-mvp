"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import {
  BookOpen,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { CommandPalette } from "@/components/command-palette";
import { FlashToast } from "@/components/flash-toast";
import { cn } from "@/lib/cn";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const NAV_GROUPS: { label?: string; items: NavItem[] }[] = [
  {
    items: [{ href: "/", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> }],
  },
  {
    label: "Studio",
    items: [
      { href: "/customers", label: "Customers", icon: <Users className="size-4" /> },
      { href: "/catalogues", label: "Catalogues", icon: <BookOpen className="size-4" /> },
      { href: "/quotations", label: "Quotations", icon: <FileText className="size-4" /> },
      { href: "/payments", label: "Payments", icon: <CreditCard className="size-4" /> },
    ],
  },
  {
    label: "Business",
    items: [{ href: "/settings", label: "Settings", icon: <Settings className="size-4" /> }],
  },
];

const ALL_NAV = NAV_GROUPS.flatMap((group) => group.items);

const TAB_BAR: NavItem[] = [
  { href: "/", label: "Home", icon: <LayoutDashboard className="size-5" /> },
  { href: "/customers", label: "Clients", icon: <Users className="size-5" /> },
  { href: "/quotations", label: "Quotes", icon: <FileText className="size-5" /> },
  { href: "/payments", label: "Payments", icon: <CreditCard className="size-5" /> },
];

const CREATE_ACTIONS = [
  { href: "/quotations/new", label: "Quotation", hint: "Offer for a client" },
  { href: "/customers/new", label: "Customer", hint: "New client profile" },
  { href: "/payments/new", label: "Payment", hint: "Log money received" },
  { href: "/catalogues/new", label: "Catalogue", hint: "Reusable package" },
];

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shownPath, setShownPath] = useState(pathname);

  // Navigating away dismisses the drawer, adjusted during render rather than
  // in an effect so there is no flash of the open panel on the new route.
  if (shownPath !== pathname) {
    setShownPath(pathname);
    setDrawerOpen(false);
  }

  // ⌘K / Ctrl+K opens the palette from anywhere.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const activeLabel = ALL_NAV.find((item) => isActive(item.href, pathname))?.label ?? "Camtrio";

  return (
    <div className="min-h-dvh lg:pl-[248px]">
      {/* Desktop sidebar */}
      <aside className="hidden bg-sidebar text-sidebar-fg lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[248px] lg:flex-col lg:overflow-hidden">
        <Brand />
        <nav className="scroll-slim flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 py-5">
          {NAV_GROUPS.map((group, index) => (
            <div key={group.label ?? index} className="flex flex-col gap-0.5">
              {group.label ? (
                <p className="mb-1.5 px-3 text-[0.6875rem] font-semibold tracking-[0.14em] text-white/35 uppercase">
                  {group.label}
                </p>
              ) : null}
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          ))}
        </nav>
        <div className="mt-auto space-y-2 border-t border-white/10 px-3 py-4">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-white/12 px-3 py-2 text-left text-sm text-white/65 transition hover:bg-white/8 hover:text-white"
          >
            <Search className="size-4" />
            <span className="flex-1">Search</span>
            <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-[0.6875rem]">⌘K</kbd>
          </button>
          <SignOutButton className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white/60 transition hover:bg-white/8 hover:text-white" />
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="animate-fade-in absolute inset-0 bg-sidebar/60 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative flex h-full w-[min(19rem,88vw)] flex-col bg-sidebar text-sidebar-fg shadow-overlay">
            <div className="flex items-start justify-between">
              <Brand />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="m-4 inline-flex size-9 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <nav className="scroll-slim flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 py-5">
              {NAV_GROUPS.map((group, index) => (
                <div key={group.label ?? index} className="flex flex-col gap-0.5">
                  {group.label ? (
                    <p className="mb-1.5 px-3 text-[0.6875rem] font-semibold tracking-[0.14em] text-white/35 uppercase">
                      {group.label}
                    </p>
                  ) : null}
                  {group.items.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} />
                  ))}
                </div>
              ))}
            </nav>
            <div className="border-t border-white/10 px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <SignOutButton className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-white/60 transition hover:bg-white/8 hover:text-white" />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-dvh min-w-0 flex-col">
        {/* Utility bar: mobile nav trigger + global search + quick create */}
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border bg-card/85 px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] backdrop-blur-md sm:px-6 lg:py-2">
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition hover:bg-card lg:hidden"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="size-5" />
          </button>

          <p className="min-w-0 flex-1 truncate font-display text-base tracking-[0.16em] text-accent-dark uppercase lg:hidden">
            Camtrio
          </p>
          <p className="hidden min-w-0 flex-1 truncate text-sm font-medium text-muted lg:block">
            {activeLabel}
          </p>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Search"
            className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-muted transition hover:text-foreground lg:hidden"
          >
            <Search className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted transition hover:border-border-strong hover:text-foreground lg:flex"
          >
            <Search className="size-4" />
            <span>Search…</span>
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[0.6875rem]">
              ⌘K
            </kbd>
          </button>

          <CreateMenu />
        </header>

        <main className="flex-1 px-3 py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-7 lg:pb-10">
          {children}
        </main>

        {/* Mobile tab bar — primary destinations stay in thumb reach */}
        <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
          {TAB_BAR.map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.6875rem] font-medium transition",
                  active ? "text-accent-dark" : "text-muted",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition",
                    active ? "bg-accent-soft" : "",
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.6875rem] font-medium text-muted"
          >
            <span className="flex h-7 w-12 items-center justify-center">
              <MoreHorizontal className="size-5" />
            </span>
            More
          </button>
        </nav>
      </div>

      {paletteOpen ? <CommandPalette onClose={() => setPaletteOpen(false)} /> : null}

      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>
      <Toaster
        position="top-center"
        offset={16}
        toastOptions={{
          className:
            "!rounded-xl !border !border-border !bg-card !font-sans !text-foreground !shadow-raised",
        }}
      />
    </div>
  );
}

function Brand() {
  return (
    <div className="border-b border-white/10 px-5 py-6">
      <div className="mb-3 h-1 w-10 rounded-full bg-[#7cb89a]" />
      <p className="font-display text-2xl tracking-[0.18em] uppercase">
        Camtrio
      </p>
      <p className="mt-1 text-xs text-white/50">Studio Management</p>
    </div>
  );
}

/** Subtle dot that appears only when a navigation is actually taking time. */
function PendingHint() {
  const { pending } = useLinkStatus();
  return <span aria-hidden className={cn("link-hint", pending && "is-pending")} />;
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(item.href, pathname);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition",
        active
          ? "bg-white/12 font-medium text-white"
          : "text-white/65 hover:bg-white/8 hover:text-white",
      )}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[#7cb89a]"
        />
      ) : null}
      <span className={active ? "text-[#9ed0b7]" : "text-white/45 group-hover:text-white/70"}>
        {item.icon}
      </span>
      <span className="flex-1">{item.label}</span>
      <PendingHint />
    </Link>
  );
}

function CreateMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-white shadow-sm transition hover:bg-accent-dark"
      >
        <Plus className="size-4" />
        <span className="hidden sm:inline">New</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="animate-rise absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-card shadow-raised"
        >
          {CREATE_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-start gap-3 px-3.5 py-2.5 transition hover:bg-accent-soft/60"
            >
              <Plus className="mt-0.5 size-4 shrink-0 text-accent" />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{action.label}</span>
                <span className="block text-xs text-muted">{action.hint}</span>
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <button type="submit" className={className}>
        <LogOut className="size-4" />
        <span>Sign out</span>
      </button>
    </form>
  );
}
