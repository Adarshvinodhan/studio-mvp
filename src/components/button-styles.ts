import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "danger-ghost";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

const BASE =
  "inline-flex select-none items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition active:translate-y-px disabled:pointer-events-none disabled:opacity-55";

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-[0.8125rem]",
  md: "min-h-11 px-4 text-sm sm:min-h-10",
  lg: "min-h-12 px-5 text-base",
  icon: "h-11 w-11 sm:h-10 sm:w-10",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white shadow-sm hover:bg-accent-dark",
  secondary:
    "border border-border bg-surface text-foreground shadow-sm hover:border-border-strong hover:bg-card",
  ghost: "text-muted hover:bg-accent-soft/70 hover:text-accent-dark",
  danger: "bg-danger text-white shadow-sm hover:brightness-110",
  "danger-ghost": "text-danger hover:bg-danger-soft",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(BASE, SIZES[size], VARIANTS[variant], className);
}
