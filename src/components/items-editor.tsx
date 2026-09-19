"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Copy, Plus, Trash2, Undo2 } from "lucide-react";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/button-styles";
import { Spinner } from "@/components/spinner";
import { inputClass } from "@/components/ui";

export type EditorItem = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  quantity: number;
  unitPrice: number;
};

export type ItemsPayload = {
  discount: number;
  tax: number;
  items: {
    id: string | null;
    name: string;
    description: string | null;
    category: string | null;
    quantity: number;
    unitPrice: number;
  }[];
};

type Row = {
  key: string;
  id: string | null;
  name: string;
  category: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

let rowCounter = 0;
function newKey() {
  rowCounter += 1;
  return `row-${rowCounter}`;
}

function toRows(items: EditorItem[]): Row[] {
  return items.map((item) => ({
    key: newKey(),
    id: item.id,
    name: item.name,
    category: item.category ?? "",
    description: item.description ?? "",
    quantity: String(item.quantity),
    unitPrice: String(item.unitPrice),
  }));
}

function blankRow(): Row {
  return {
    key: newKey(),
    id: null,
    name: "",
    category: "",
    description: "",
    quantity: "1",
    unitPrice: "0",
  };
}

function n(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Ignores row keys, so re-keying never registers as an edit. */
function snapshot(rows: Row[], discount: string, tax: string) {
  return JSON.stringify({
    rows: rows.map((row) => [
      row.id,
      row.name.trim(),
      row.category.trim(),
      row.description.trim(),
      n(row.quantity),
      n(row.unitPrice),
    ]),
    discount: n(discount),
    tax: n(tax),
  });
}

/**
 * Line items with live arithmetic and a single save. Rows live in local state
 * so adding, editing, reordering and deleting is one round trip instead of a
 * form submit per row.
 */
export function ItemsEditor({
  items,
  discount: initialDiscount = 0,
  tax: initialTax = 0,
  showMoneyAdjustments = true,
  totalLabel = "Total",
  save,
  savedTitle = "Saved",
}: {
  items: EditorItem[];
  discount?: number;
  tax?: number;
  showMoneyAdjustments?: boolean;
  totalLabel?: string;
  save: (payload: ItemsPayload) => Promise<unknown>;
  savedTitle?: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(() => toRows(items));
  const [discount, setDiscount] = useState(String(initialDiscount));
  const [tax, setTax] = useState(String(initialTax));
  const [saving, startSaving] = useTransition();
  const lastAddedRef = useRef<string | null>(null);

  const baseline = useMemo(
    () => snapshot(toRows(items), String(initialDiscount), String(initialTax)),
    [items, initialDiscount, initialTax],
  );
  const dirty = snapshot(rows, discount, tax) !== baseline;

  const subtotal = rows.reduce((sum, row) => sum + n(row.quantity) * n(row.unitPrice), 0);
  const total = showMoneyAdjustments
    ? Math.max(0, subtotal - n(discount) + n(tax))
    : subtotal;

  const update = (key: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const addRow = () => {
    const row = blankRow();
    lastAddedRef.current = row.key;
    setRows((prev) => [...prev, row]);
  };

  const duplicateRow = (key: string) =>
    setRows((prev) => {
      const index = prev.findIndex((row) => row.key === key);
      if (index === -1) return prev;
      const copy = { ...prev[index], key: newKey(), id: null };
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
    });

  const removeRow = (key: string) => setRows((prev) => prev.filter((row) => row.key !== key));

  const moveRow = (key: string, direction: -1 | 1) =>
    setRows((prev) => {
      const index = prev.findIndex((row) => row.key === key);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const reset = () => {
    setRows(toRows(items));
    setDiscount(String(initialDiscount));
    setTax(String(initialTax));
  };

  // Focus the name field of a freshly added row so typing can continue.
  useEffect(() => {
    if (!lastAddedRef.current) return;
    const selector = `[data-row-key="${lastAddedRef.current}"] input[data-field="name"]`;
    document.querySelector<HTMLInputElement>(selector)?.focus();
    lastAddedRef.current = null;
  }, [rows.length]);

  const commit = useCallback(() => {
    startSaving(async () => {
      try {
        await save({
          discount: n(discount),
          tax: n(tax),
          items: rows.map((row) => ({
            id: row.id,
            name: row.name,
            description: row.description,
            category: row.category,
            quantity: n(row.quantity),
            unitPrice: n(row.unitPrice),
          })),
        });
        toast.success(savedTitle, { description: `${totalLabel} ${formatINR(total)}` });
        router.refresh();
      } catch {
        toast.error("Could not save", { description: "Check the values and try again." });
      }
    });
  }, [discount, rows, router, save, savedTitle, tax, total, totalLabel]);

  // ⌘S / Ctrl+S saves without reaching for the button.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (dirty && !saving) commit();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commit, dirty, saving]);

  const GRID =
    "lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1.2fr)_5.5rem_7rem_7rem_auto]";

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "hidden gap-2 px-1 text-[0.6875rem] font-semibold tracking-[0.1em] text-muted uppercase lg:grid",
          GRID,
        )}
      >
        <span>Item</span>
        <span>Category</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Unit price</span>
        <span className="text-right">Line total</span>
        <span className="sr-only">Actions</span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong/70 px-6 py-10 text-center">
          <p className="text-sm text-muted">No line items yet.</p>
          <button type="button" onClick={addRow} className={buttonClass("secondary", "sm", "mt-3")}>
            <Plus className="size-4" />
            Add the first item
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, index) => {
            const line = n(row.quantity) * n(row.unitPrice);
            return (
              <li
                key={row.key}
                data-row-key={row.key}
                className="rounded-xl border border-border bg-surface/70 p-3 shadow-sm transition hover:border-border-strong/80"
              >
                <div className={cn("grid gap-2 lg:items-start", GRID)}>
                  <div>
                    <span className="mb-1 block text-xs font-medium text-muted lg:hidden">
                      Item {index + 1}
                    </span>
                    <input
                      data-field="name"
                      value={row.name}
                      onChange={(event) => update(row.key, { name: event.target.value })}
                      placeholder="Item name"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <span className="mb-1 block text-xs font-medium text-muted lg:hidden">
                      Category
                    </span>
                    <input
                      value={row.category}
                      onChange={(event) => update(row.key, { category: event.target.value })}
                      placeholder="e.g. Photography"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 lg:contents">
                    <div>
                      <span className="mb-1 block text-xs font-medium text-muted lg:hidden">
                        Qty
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        value={row.quantity}
                        onChange={(event) => update(row.key, { quantity: event.target.value })}
                        className={cn(inputClass, "tabular lg:text-right")}
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-xs font-medium text-muted lg:hidden">
                        Unit price
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        value={row.unitPrice}
                        onChange={(event) => update(row.key, { unitPrice: event.target.value })}
                        className={cn(inputClass, "tabular lg:text-right")}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 lg:h-11 lg:justify-end">
                    <span className="text-xs font-medium text-muted lg:hidden">Line total</span>
                    <span className="tabular text-sm font-semibold text-foreground">
                      {formatINR(line)}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 lg:h-11">
                    <RowAction
                      label="Move up"
                      onClick={() => moveRow(row.key, -1)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="size-4" />
                    </RowAction>
                    <RowAction
                      label="Move down"
                      onClick={() => moveRow(row.key, 1)}
                      disabled={index === rows.length - 1}
                    >
                      <ArrowDown className="size-4" />
                    </RowAction>
                    <RowAction label="Duplicate" onClick={() => duplicateRow(row.key)}>
                      <Copy className="size-4" />
                    </RowAction>
                    <RowAction label="Remove" danger onClick={() => removeRow(row.key)}>
                      <Trash2 className="size-4" />
                    </RowAction>
                  </div>
                </div>

                <input
                  value={row.description}
                  onChange={(event) => update(row.key, { description: event.target.value })}
                  placeholder="Description (optional)"
                  className={cn(inputClass, "mt-2 bg-card/60")}
                />
              </li>
            );
          })}
        </ul>
      )}

      <button type="button" onClick={addRow} className={buttonClass("secondary", "md")}>
        <Plus className="size-4" />
        Add item
      </button>

      {/* Totals recompute as you type — no save needed to see the effect */}
      <div className="rounded-xl border border-border bg-surface/70 p-4">
        {showMoneyAdjustments ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <AdjustmentField label="Discount" value={discount} onChange={setDiscount} />
            <AdjustmentField label="GST / Tax" value={tax} onChange={setTax} />
          </div>
        ) : null}

        <dl
          className={cn(
            "space-y-1.5 text-sm",
            showMoneyAdjustments ? "mt-4 border-t border-border pt-4" : "",
          )}
        >
          <Line
            label={`Subtotal (${rows.length} item${rows.length === 1 ? "" : "s"})`}
            value={formatINR(subtotal)}
          />
          {showMoneyAdjustments ? (
            <>
              <Line label="Discount" value={`− ${formatINR(n(discount))}`} />
              <Line label="GST / Tax" value={formatINR(n(tax))} />
            </>
          ) : null}
          <div className="flex items-baseline justify-between border-t border-border pt-2.5">
            <dt className="text-base font-semibold text-foreground">{totalLabel}</dt>
            <dd className="tabular font-display text-2xl font-semibold text-accent-dark">
              {formatINR(total)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Save bar only appears once there is something to save */}
      {dirty ? (
        <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-3 lg:bottom-6 lg:pr-6 lg:pl-[calc(248px+1.5rem)]">
          <div className="animate-rise flex w-full max-w-3xl flex-wrap items-center gap-3 rounded-xl border border-accent/25 bg-card/95 px-4 py-3 shadow-raised backdrop-blur-md">
            <p className="min-w-0 flex-1 text-sm">
              <span className="font-medium text-foreground">Unsaved changes</span>
              <span className="tabular ml-2 text-muted">
                {totalLabel} {formatINR(total)}
              </span>
            </p>
            <button
              type="button"
              onClick={reset}
              disabled={saving}
              className={buttonClass("ghost", "sm")}
            >
              <Undo2 className="size-4" />
              Discard
            </button>
            <button
              type="button"
              onClick={commit}
              disabled={saving}
              className={buttonClass("primary", "md")}
            >
              {saving ? <Spinner /> : null}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AdjustmentField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted">
          ₹
        </span>
        <input
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(inputClass, "tabular pl-7")}
        />
      </span>
    </label>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  );
}

function RowAction({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg transition disabled:opacity-30",
        danger
          ? "text-danger hover:bg-danger-soft"
          : "text-muted hover:bg-accent-soft/70 hover:text-accent-dark",
      )}
    >
      {children}
    </button>
  );
}
