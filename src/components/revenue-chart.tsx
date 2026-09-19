import { formatINR } from "@/lib/money";
import { cn } from "@/lib/cn";

export type RevenuePoint = { label: string; value: number };

/**
 * Compact monthly bar chart. Rendered server-side with plain elements — no
 * charting dependency for six bars.
 */
export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const max = Math.max(...data.map((point) => point.value), 1);
  const hasAny = data.some((point) => point.value > 0);

  return (
    <div>
      <div className="flex h-44 items-end gap-2 sm:gap-3">
        {data.map((point) => {
          const ratio = point.value / max;
          const isPeak = point.value === max && point.value > 0;
          return (
            <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span
                className={cn(
                  "tabular text-[0.6875rem] font-medium",
                  point.value > 0 ? "text-foreground" : "text-muted/50",
                )}
              >
                {point.value > 0 ? compact(point.value) : "—"}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  title={`${point.label}: ${formatINR(point.value)}`}
                  style={{ height: `${Math.max(ratio * 100, point.value > 0 ? 4 : 1.5)}%` }}
                  className={cn(
                    "w-full rounded-t-md transition-all",
                    isPeak
                      ? "bg-accent"
                      : point.value > 0
                        ? "bg-accent/45"
                        : "bg-border-strong/35",
                  )}
                />
              </div>
              <span className="truncate text-[0.6875rem] text-muted">{point.label}</span>
            </div>
          );
        })}
      </div>
      {!hasAny ? (
        <p className="mt-3 text-center text-xs text-muted">
          No payments recorded in this period yet.
        </p>
      ) : null}
    </div>
  );
}

function compact(value: number) {
  if (value >= 10_000_000) return `${(value / 10_000_000).toFixed(1)}Cr`;
  if (value >= 100_000) return `${(value / 100_000).toFixed(1)}L`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(Math.round(value));
}
