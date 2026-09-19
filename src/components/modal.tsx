"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Overlay primitive shared by the confirm dialog, command palette and PDF
 * preview: portals to body, locks scroll, closes on Escape, keeps Tab inside
 * and returns focus to whatever opened it.
 */
export function Modal({
  onClose,
  label,
  children,
  className,
  align = "center",
  initialFocus,
}: {
  onClose: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
  align?: "center" | "top";
  initialFocus?: React.RefObject<HTMLElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTarget =
      initialFocus?.current ??
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      panelRef.current;
    focusTarget?.focus({ preventScroll: true });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.({ preventScroll: true });
    };
  }, [onClose, initialFocus]);

  // Modals only ever render from client interaction, so there is no SSR pass
  // to mismatch; this guard just keeps `document` access safe.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[100] flex justify-center p-0 sm:p-6",
        align === "top" ? "items-end sm:items-start sm:pt-[12vh]" : "items-end sm:items-center",
      )}
    >
      <div
        className="animate-fade-in absolute inset-0 bg-sidebar/60 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn(
          "animate-rise relative flex w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-overlay outline-none sm:rounded-2xl",
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function ModalHeader({
  title,
  eyebrow,
  onClose,
  children,
}: {
  title: React.ReactNode;
  eyebrow?: string;
  onClose?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-surface/70 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[0.6875rem] tracking-[0.14em] text-accent-dark uppercase">{eyebrow}</p>
        ) : null}
        <p className="font-display text-lg break-words text-foreground">
          {title}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition hover:bg-surface-sunken hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
    </header>
  );
}
