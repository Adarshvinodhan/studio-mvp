"use client";

import { useFormStatus } from "react-dom";
import { buttonClass, type ButtonSize, type ButtonVariant } from "@/components/button-styles";
import { Spinner } from "@/components/spinner";

/**
 * Submit button that reflects the enclosing form's pending state, so every
 * server action in the app gives immediate feedback on click.
 */
export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  pendingLabel,
  icon,
  formAction,
  name,
  value,
  title,
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  pendingLabel?: string;
  icon?: React.ReactNode;
  formAction?: (formData: FormData) => void | Promise<void>;
  name?: string;
  value?: string;
  title?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      formAction={formAction}
      name={name}
      value={value}
      title={title}
      disabled={pending}
      aria-busy={pending}
      className={buttonClass(variant, size, className)}
    >
      {pending ? <Spinner /> : icon}
      <span>{pending ? (pendingLabel ?? "Working…") : children}</span>
    </button>
  );
}
