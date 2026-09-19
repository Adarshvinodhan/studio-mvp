"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronDown } from "lucide-react";
import { setQuotationStatusAction } from "@/lib/actions/quotations";
import { StatusBadge } from "@/components/ui";
import { Spinner } from "@/components/spinner";
import { cn } from "@/lib/cn";

const STATUSES = [
  { value: "DRAFT", hint: "Not tracked for payments" },
  { value: "SENT", hint: "Shared with the client" },
  { value: "ACCEPTED", hint: "Client agreed to the offer" },
  { value: "REJECTED", hint: "Client declined" },
  { value: "COMPLETED", hint: "Delivered and settled" },
];

/** Status changes often, so it saves on selection instead of via the form. */
export function QuotationStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, startSaving] = useTransition();
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

  function choose(next: string) {
    setOpen(false);
    if (next === status) return;
    startSaving(async () => {
      try {
        await setQuotationStatusAction(id, next);
        toast.success(`Marked as ${next.toLowerCase()}`);
        router.refresh();
      } catch {
        toast.error("Could not update status");
      }
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={saving}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-surface pr-2 pl-1 text-sm shadow-sm transition hover:border-border-strong disabled:opacity-60"
      >
        {saving ? (
          <span className="flex items-center gap-1.5 px-2 text-muted">
            <Spinner className="size-3.5" />
            Updating…
          </span>
        ) : (
          <StatusBadge status={status} />
        )}
        <ChevronDown className="size-3.5 text-muted" aria-hidden />
      </button>

      {open ? (
        <div
          role="listbox"
          className="animate-rise absolute left-0 z-40 mt-1.5 w-60 overflow-hidden rounded-xl border border-border bg-card shadow-raised"
        >
          {STATUSES.map((item) => {
            const active = item.value === status;
            return (
              <button
                key={item.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => choose(item.value)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-accent-soft/60",
                  active ? "bg-accent-soft/40" : "",
                )}
              >
                <StatusBadge status={item.value} />
                <span className="min-w-0 flex-1 truncate text-xs text-muted">{item.hint}</span>
                {active ? <Check className="size-4 shrink-0 text-accent" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
