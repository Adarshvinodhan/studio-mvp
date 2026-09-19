"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { buttonClass, type ButtonSize, type ButtonVariant } from "@/components/button-styles";
import { Modal } from "@/components/modal";
import { Spinner } from "@/components/spinner";

/**
 * Destructive submit that asks first. Renders a real (hidden) submit button
 * inside the form and clicks it on confirm, so the enclosing server action —
 * including `formAction` overrides — runs exactly as it would normally.
 */
export function ConfirmSubmit({
  children,
  title,
  description,
  confirmLabel = "Delete",
  variant = "danger",
  size = "md",
  className,
  icon,
  formAction,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  icon?: React.ReactNode;
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const submitRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        aria-busy={pending}
        className={buttonClass(variant, size, className)}
      >
        {pending ? <Spinner /> : icon}
        <span>{pending ? "Deleting…" : children}</span>
      </button>

      <button
        ref={submitRef}
        type="submit"
        formAction={formAction}
        tabIndex={-1}
        aria-hidden
        className="hidden"
      />

      {open ? (
        <Modal
          label={title}
          onClose={() => setOpen(false)}
          className="max-w-md"
          initialFocus={confirmRef}
        >
          <div className="flex gap-3.5 p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
              <AlertTriangle className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg text-foreground">
                {title}
              </p>
              <p className="mt-1 text-sm text-muted">
                {description ?? "This cannot be undone."}
              </p>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-border bg-surface/60 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={buttonClass("secondary", "md")}
            >
              Cancel
            </button>
            <button
              ref={confirmRef}
              type="button"
              disabled={pending}
              onClick={() => submitRef.current?.click()}
              className={buttonClass("danger", "md")}
            >
              {pending ? <Spinner /> : null}
              <span>{pending ? "Deleting…" : confirmLabel}</span>
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
