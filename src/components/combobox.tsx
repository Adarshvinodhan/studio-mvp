"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";

export type ComboOption = {
  value: string;
  label: string;
  hint?: string;
};

/**
 * Type-to-filter replacement for long `<select>` lists. Keeps a hidden input
 * so it still submits inside a plain server-action form.
 */
export function Combobox({
  name,
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Type to filter…",
  emptyLabel = "No matches",
  required,
}: {
  name?: string;
  options: ComboOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) =>
      `${option.label} ${option.hint ?? ""}`.toLowerCase().includes(needle),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => searchRef.current?.focus());

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  function toggle() {
    if (!open) {
      // Start each session from a clean filter, highlighting the current value.
      setQuery("");
      setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value)));
    }
    setOpen((next) => !next);
  }

  function search(next: string) {
    setQuery(next);
    setActiveIndex(0);
  }

  function pick(option: ComboOption) {
    onChange(option.value);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[activeIndex];
      if (option) pick(option);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {name ? <input type="hidden" name={name} value={value} required={required} /> : null}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "flex w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-left shadow-sm transition sm:py-2",
          open ? "border-accent ring-2 ring-accent/20" : "hover:border-border-strong",
        )}
      >
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-base sm:text-sm",
              selected ? "text-foreground" : "text-muted/70",
            )}
          >
            {selected?.label ?? placeholder}
          </span>
          {selected?.hint ? (
            <span className="block truncate text-xs text-muted">{selected.hint}</span>
          ) : null}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted" aria-hidden />
      </button>

      {open ? (
        <div
          role="listbox"
          className="animate-rise absolute z-40 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-card shadow-raised"
        >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="size-3.5 shrink-0 text-muted" aria-hidden />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => search(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="scroll-slim max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted">{emptyLabel}</p>
            ) : (
              filtered.map((option, index) => {
                const active = index === activeIndex;
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value || "__empty"}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => pick(option)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition",
                      active ? "bg-accent-soft text-accent-dark" : "text-foreground",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{option.label}</span>
                      {option.hint ? (
                        <span className="block truncate text-xs text-muted">{option.hint}</span>
                      ) : null}
                    </span>
                    {isSelected ? <Check className="size-4 shrink-0 text-accent" /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
