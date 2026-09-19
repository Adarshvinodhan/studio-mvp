"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CornerDownLeft,
  CreditCard,
  FileText,
  LayoutDashboard,
  Loader2,
  Plus,
  Search,
  Settings,
  UserRound,
  Users,
} from "lucide-react";
import { Modal } from "@/components/modal";
import { cn } from "@/lib/cn";
import type { SearchHit } from "@/app/api/search/route";

type Command = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  group: string;
  keywords?: string;
};

const STATIC_COMMANDS: Command[] = [
  {
    id: "new-quotation",
    title: "New quotation",
    subtitle: "Build an offer for a client",
    href: "/quotations/new",
    icon: <Plus className="size-4" />,
    group: "Create",
    keywords: "add create quote estimate",
  },
  {
    id: "new-customer",
    title: "New customer",
    subtitle: "Add a client profile",
    href: "/customers/new",
    icon: <Plus className="size-4" />,
    group: "Create",
    keywords: "add create client",
  },
  {
    id: "new-payment",
    title: "Record payment",
    subtitle: "Log a transaction and issue a receipt",
    href: "/payments/new",
    icon: <Plus className="size-4" />,
    group: "Create",
    keywords: "add money receipt paid",
  },
  {
    id: "new-catalogue",
    title: "New catalogue",
    subtitle: "Create a reusable package",
    href: "/catalogues/new",
    icon: <Plus className="size-4" />,
    group: "Create",
    keywords: "add package",
  },
  {
    id: "go-dashboard",
    title: "Dashboard",
    subtitle: "Studio overview",
    href: "/",
    icon: <LayoutDashboard className="size-4" />,
    group: "Go to",
    keywords: "home overview",
  },
  {
    id: "go-customers",
    title: "Customers",
    subtitle: "All client profiles",
    href: "/customers",
    icon: <Users className="size-4" />,
    group: "Go to",
    keywords: "clients",
  },
  {
    id: "go-catalogues",
    title: "Catalogues",
    subtitle: "Reusable packages",
    href: "/catalogues",
    icon: <BookOpen className="size-4" />,
    group: "Go to",
    keywords: "packages",
  },
  {
    id: "go-quotations",
    title: "Quotations",
    subtitle: "All offers",
    href: "/quotations",
    icon: <FileText className="size-4" />,
    group: "Go to",
    keywords: "quotes estimates",
  },
  {
    id: "go-payments",
    title: "Payments",
    subtitle: "Transactions and receipts",
    href: "/payments",
    icon: <CreditCard className="size-4" />,
    group: "Go to",
    keywords: "money receipts",
  },
  {
    id: "go-settings",
    title: "Settings",
    subtitle: "Business details used on PDFs",
    href: "/settings",
    icon: <Settings className="size-4" />,
    group: "Go to",
    keywords: "business logo bank terms",
  },
  {
    id: "go-pending",
    title: "Quotations with a pending balance",
    subtitle: "Filtered list to chase up",
    href: "/quotations?payment=pending",
    icon: <ArrowRight className="size-4" />,
    group: "Go to",
    keywords: "outstanding due follow up",
  },
];

const HIT_ICONS = {
  customer: <UserRound className="size-4" />,
  quotation: <FileText className="size-4" />,
  catalogue: <BookOpen className="size-4" />,
} as const;

const HIT_GROUPS = {
  customer: "Customers",
  quotation: "Quotations",
  catalogue: "Catalogues",
} as const;

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < 2) return; // cleared eagerly in `changeQuery`

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(needle)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as { hits: SearchHit[] };
        setHits(data.hits ?? []);
      } catch {
        if (!controller.signal.aborted) setHits([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 180);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const commands = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const statics = needle
      ? STATIC_COMMANDS.filter((command) =>
          `${command.title} ${command.subtitle} ${command.keywords ?? ""}`
            .toLowerCase()
            .includes(needle),
        )
      : STATIC_COMMANDS;

    const records: Command[] = hits.map((hit) => ({
      id: `${hit.kind}-${hit.id}`,
      title: hit.title,
      subtitle: hit.subtitle,
      href: hit.href,
      icon: HIT_ICONS[hit.kind],
      group: HIT_GROUPS[hit.kind],
    }));

    return [...records, ...statics];
  }, [hits, query]);

  // Clamped rather than reset in an effect, so late-arriving search hits never
  // leave the highlight pointing past the end of the list.
  const active = Math.min(activeIndex, Math.max(0, commands.length - 1));

  function changeQuery(next: string) {
    setQuery(next);
    setActiveIndex(0);
    if (next.trim().length < 2) {
      setHits([]);
      setSearching(false);
    }
  }

  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (commands.length ? (i + 1) % commands.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (commands.length ? (i - 1 + commands.length) % commands.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = commands[active];
      if (target) go(target.href);
    }
  }

  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  let lastGroup = "";

  return (
    <Modal
      label="Search and commands"
      onClose={onClose}
      align="top"
      className="max-h-[80dvh] sm:max-w-2xl"
      initialFocus={inputRef}
    >
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        {searching ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-accent" />
        ) : (
          <Search className="size-4 shrink-0 text-muted" />
        )}
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => changeQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search customers, quotations, catalogues…"
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted/70"
          aria-label="Search"
          autoComplete="off"
          spellCheck={false}
        />
        <kbd className="hidden rounded border border-border bg-surface px-1.5 py-0.5 text-[0.6875rem] text-muted sm:block">
          Esc
        </kbd>
      </div>

      <div ref={listRef} className="scroll-slim min-h-0 flex-1 overflow-y-auto p-2">
        {commands.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-muted">
            No matches for “{query.trim()}”.
          </p>
        ) : (
          commands.map((command, index) => {
            const showGroup = command.group !== lastGroup;
            lastGroup = command.group;
            const isActive = index === active;
            return (
              <div key={command.id}>
                {showGroup ? (
                  <p className="px-3 pt-3 pb-1 text-[0.6875rem] font-semibold tracking-[0.12em] text-muted uppercase">
                    {command.group}
                  </p>
                ) : null}
                <button
                  type="button"
                  data-active={isActive}
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => go(command.href)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition",
                    isActive ? "bg-accent-soft text-accent-dark" : "text-foreground",
                  )}
                >
                  <span className={isActive ? "text-accent-dark" : "text-muted"}>
                    {command.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{command.title}</span>
                    <span className="block truncate text-xs text-muted">{command.subtitle}</span>
                  </span>
                  {isActive ? <CornerDownLeft className="size-3.5 shrink-0 opacity-70" /> : null}
                </button>
              </div>
            );
          })
        )}
      </div>

      <footer className="hidden items-center gap-4 border-t border-border bg-surface/60 px-4 py-2 text-[0.6875rem] text-muted sm:flex">
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border border-border bg-surface px-1.5 py-0.5">↑↓</kbd> navigate
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border border-border bg-surface px-1.5 py-0.5">↵</kbd> open
        </span>
      </footer>
    </Modal>
  );
}
