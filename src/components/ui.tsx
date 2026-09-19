import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonClass, type ButtonSize, type ButtonVariant } from "@/components/button-styles";

export { SubmitButton } from "@/components/submit-button";
export { ConfirmSubmit } from "@/components/confirm-submit";
export { buttonClass };
export type { ButtonSize, ButtonVariant };

/* ---------------------------------------------------------------- buttons */

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  prefetch,
  title,
}: {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  prefetch?: boolean;
  title?: string;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      title={title}
      className={buttonClass(variant, size, className)}
    >
      {children}
    </Link>
  );
}

/* --------------------------------------------------------------- surfaces */

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/90 p-4 shadow-card backdrop-blur-[2px] sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A card with a titled header strip — used for the long form panels. */
export function Panel({
  title,
  description,
  icon,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card/90 shadow-card",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 bg-surface/60 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-start gap-2.5">
          {icon ? <span className="mt-0.5 text-accent">{icon}</span> : null}
          <div className="min-w-0">
            <h2 className="font-display text-lg leading-tight text-foreground sm:text-xl">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-xs text-muted sm:text-[0.8125rem]">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ----------------------------------------------------------------- header */

export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2 min-w-0">
      <ol className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-1">
            {i > 0 ? <ChevronRight className="size-3 shrink-0 opacity-60" aria-hidden /> : null}
            {item.href ? (
              <Link href={item.href} className="truncate hover:text-accent-dark hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="truncate text-foreground/70">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  badge,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  badge?: React.ReactNode;
}) {
  return (
    <div className="mb-5 sm:mb-6">
      {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-semibold tracking-tight break-words text-foreground sm:text-3xl">
              {title}
            </h1>
            {badge}
          </div>
          {description ? (
            <p className="mt-1 text-sm text-muted">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

export function SectionHeading({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="font-display text-xl text-foreground">{title}</h2>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ forms */

export function Field({
  label,
  children,
  hint,
  required,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="flex items-center gap-1 text-sm font-medium text-foreground">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden>
            *
          </span>
        ) : null}
      </span>
      {children}
      {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "field-control w-full min-w-0 rounded-lg border border-border bg-surface px-3 py-2.5 text-base text-foreground shadow-sm outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20 sm:py-2 sm:text-sm";

/** Currency inputs get a leading ₹ so the unit is never ambiguous. */
export function MoneyInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className="relative block">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted">
        ₹
      </span>
      <input
        type="number"
        step="0.01"
        inputMode="decimal"
        {...props}
        className={cn(inputClass, "tabular pl-7", className)}
      />
    </span>
  );
}

export function MobileLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs font-medium text-muted sm:hidden">{children}</span>;
}

export function FormActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 border-t border-border/70 pt-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------- indicators */

export function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    info: "border-border bg-surface text-foreground",
    success: "border-success/25 bg-success-soft text-success",
    warning: "border-warning/25 bg-warning-soft text-warning",
    danger: "border-danger/25 bg-danger-soft text-danger",
  } as const;
  return (
    <div className={cn("rounded-lg border px-3.5 py-2.5 text-sm", tones[tone], className)}>
      {children}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-surface-sunken text-muted ring-border-strong/60",
  SENT: "bg-warning-soft text-warning ring-warning/20",
  ACCEPTED: "bg-accent-soft text-accent-dark ring-accent/25",
  REJECTED: "bg-danger-soft text-danger ring-danger/20",
  COMPLETED: "bg-success-soft text-success ring-success/25",
  ACTIVE: "bg-success-soft text-success ring-success/25",
  ARCHIVED: "bg-surface-sunken text-muted ring-border-strong/60",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        STATUS_STYLES[status] ?? "bg-accent-soft text-accent-dark ring-accent/25",
        className,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "bg-surface-sunken text-muted ring-border-strong/60",
    accent: "bg-accent-soft text-accent-dark ring-accent/25",
    success: "bg-success-soft text-success ring-success/25",
    warning: "bg-warning-soft text-warning ring-warning/20",
    danger: "bg-danger-soft text-danger ring-danger/20",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------- skeletons */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-shimmer rounded-md bg-border-strong/35", className)}
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <Card>
      <Skeleton className="h-4 w-1/3" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={i === lines - 1 ? "h-3 w-1/2" : "h-3 w-full"} />
        ))}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------ empty state */

export function EmptyState({
  message,
  title,
  icon,
  action,
}: {
  message: string;
  title?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      {icon ? (
        <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
          {icon}
        </span>
      ) : null}
      {title ? (
        <p className="font-display text-lg text-foreground">{title}</p>
      ) : null}
      <p className="max-w-sm text-sm text-muted">{message}</p>
      {action ? <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ lists */

export function ResponsiveRecords({
  cards,
  table,
}: {
  cards: React.ReactNode;
  table: React.ReactNode;
}) {
  return (
    <>
      <div className="grid gap-3 md:hidden">{cards}</div>
      <div className="scroll-slim hidden overflow-x-auto rounded-xl border border-border bg-card/90 shadow-card md:block">
        {table}
      </div>
    </>
  );
}

export function Th({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-muted uppercase",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <td className={cn("px-4 py-3", align === "right" ? "text-right" : "", className)}>
      {children}
    </td>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-border bg-surface-sunken/60">
      <tr>{children}</tr>
    </thead>
  );
}

export function TableRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "border-b border-border/60 transition-colors last:border-0 hover:bg-accent-soft/30",
        className,
      )}
    >
      {children}
    </tr>
  );
}

/** A label/value pair used in summary strips. */
export function Metric({
  label,
  value,
  tone = "default",
  icon,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "accent" | "warning" | "success";
  icon?: React.ReactNode;
  hint?: React.ReactNode;
}) {
  const tones = {
    default: "text-foreground",
    accent: "text-accent-dark",
    warning: "text-warning",
    success: "text-success",
  } as const;
  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-wider text-muted uppercase">{label}</p>
        {icon ? <span className="text-accent/70">{icon}</span> : null}
      </div>
      <p
        className={cn(
          "tabular font-display text-2xl leading-tight break-words sm:text-3xl",
          tones[tone],
        )}
      >
        {value}
      </p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </Card>
  );
}
