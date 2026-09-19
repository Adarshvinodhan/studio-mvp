"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Debounced URL-driven search. Filtering happens on the server, but results
 * update as you type instead of behind a Search button.
 */
export function SearchInput({
  basePath,
  value,
  preserve = {},
  placeholder = "Search…",
  className,
}: {
  basePath: string;
  value?: string;
  /** Other query params to keep when the term changes. */
  preserve?: Record<string, string | undefined>;
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const committed = value ?? "";
  const [term, setTerm] = useState(committed);
  const [syncedValue, setSyncedValue] = useState(committed);
  const [pending, startTransition] = useTransition();

  // Re-sync when navigation changes the term from elsewhere (e.g. Clear
  // filters). Adjusted during render so there is no intermediate paint.
  if (syncedValue !== committed) {
    setSyncedValue(committed);
    setTerm(committed);
  }

  // Serialised so the effect isn't retriggered by a fresh object each render.
  const preserveKey = useMemo(() => JSON.stringify(preserve), [preserve]);

  useEffect(() => {
    if (term.trim() === committed.trim()) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      const kept = JSON.parse(preserveKey) as Record<string, string | undefined>;
      for (const [key, param] of Object.entries(kept)) {
        if (param && param !== "all") params.set(key, param);
      }
      if (term.trim()) params.set("q", term.trim());
      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false });
      });
    }, 280);

    return () => clearTimeout(timer);
  }, [basePath, committed, preserveKey, router, term]);

  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">
        {pending ? (
          <Loader2 className="size-4 animate-spin text-accent" />
        ) : (
          <Search className="size-4" />
        )}
      </span>
      <input
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        className="field-control w-full rounded-lg border border-border bg-surface py-2.5 pr-10 pl-9 text-base shadow-sm outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20 sm:py-2 sm:text-sm"
      />
      {term ? (
        <button
          type="button"
          onClick={() => setTerm("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted transition hover:bg-surface-sunken hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
