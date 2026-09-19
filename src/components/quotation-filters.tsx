import Link from "next/link";
import { X } from "lucide-react";
import {
  PAYMENT_FILTERS,
  STATUS_FILTERS,
  type PaymentFilter,
} from "@/lib/quotation-filters";
import { SearchInput } from "@/components/search-input";
import { cn } from "@/lib/cn";

function buildHref(
  basePath: string,
  opts: { q?: string; payment?: string; status?: string },
) {
  const params = new URLSearchParams();
  if (opts.q?.trim()) params.set("q", opts.q.trim());
  if (opts.payment && opts.payment !== "all") params.set("payment", opts.payment);
  if (opts.status && opts.status !== "all") params.set("status", opts.status);
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

const chipClass = (active: boolean, accent: boolean) =>
  cn(
    "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition",
    active
      ? accent
        ? "bg-accent-soft text-accent-dark ring-1 ring-accent/35"
        : "bg-sidebar text-sidebar-fg"
      : "border border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
  );

export function QuotationFilters({
  basePath,
  q,
  payment,
  status,
  showStatus = true,
}: {
  basePath: "/" | "/quotations";
  q?: string;
  payment?: PaymentFilter;
  status?: string;
  showStatus?: boolean;
}) {
  const paymentValue = payment ?? "all";
  const statusValue = status && status !== "all" ? status : "all";
  const hasFilters = Boolean(q || paymentValue !== "all" || statusValue !== "all");

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          basePath={basePath}
          value={q}
          preserve={{ payment: paymentValue, status: showStatus ? statusValue : undefined }}
          placeholder="Search by customer, quotation no, event…"
          className="w-full sm:max-w-md"
        />
        {hasFilters ? (
          <Link
            href={basePath}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-muted transition hover:text-foreground"
          >
            <X className="size-3.5" />
            Clear filters
          </Link>
        ) : null}
      </div>

      <div className="scroll-slim -mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        <div className="flex w-max min-w-full flex-nowrap items-center gap-2 pb-1">
          {PAYMENT_FILTERS.map((item) => (
            <Link
              key={item.value}
              href={buildHref(basePath, {
                q,
                payment: item.value,
                status: showStatus ? statusValue : undefined,
              })}
              className={chipClass(paymentValue === item.value, false)}
            >
              {item.label}
            </Link>
          ))}

          {showStatus ? (
            <>
              <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-border" />
              {STATUS_FILTERS.map((item) => (
                <Link
                  key={item.value}
                  href={buildHref(basePath, {
                    q,
                    payment: paymentValue,
                    status: item.value,
                  })}
                  className={chipClass(statusValue === item.value, true)}
                >
                  {item.label}
                </Link>
              ))}
            </>
          ) : null}
        </div>
      </div>

      {paymentValue !== "all" ? (
        <p className="text-xs text-muted">
          Payment filters cover active quotations only — drafts and rejected offers are
          excluded.
        </p>
      ) : null}
    </div>
  );
}
