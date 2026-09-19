"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  CreditCard,
  FileText,
  Landmark,
  MoreHorizontal,
  Receipt,
  ScrollText,
  Smartphone,
} from "lucide-react";
import { createPaymentAction } from "@/lib/actions/payments";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/cn";
import { Combobox, type ComboOption } from "@/components/combobox";
import { Field, inputClass } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export type QuotationChoice = {
  id: string;
  quotationNumber: string;
  customerName: string;
  total: number;
  paid: number;
  balance: number;
};

const METHODS = [
  { value: "UPI", label: "UPI", icon: <Smartphone className="size-4" /> },
  { value: "CASH", label: "Cash", icon: <Banknote className="size-4" /> },
  { value: "BANK_TRANSFER", label: "Bank", icon: <Landmark className="size-4" /> },
  { value: "CHEQUE", label: "Cheque", icon: <ScrollText className="size-4" /> },
  { value: "CARD", label: "Card", icon: <CreditCard className="size-4" /> },
  { value: "OTHER", label: "Other", icon: <MoreHorizontal className="size-4" /> },
];

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export function NewPaymentForm({
  quotations,
  defaultQuotationId,
}: {
  quotations: QuotationChoice[];
  defaultQuotationId?: string;
}) {
  const [quotationId, setQuotationId] = useState(
    () => defaultQuotationId ?? quotations[0]?.id ?? "",
  );
  const selected = quotations.find((item) => item.id === quotationId);
  const [amount, setAmount] = useState(() => {
    const initial = quotations.find((item) => item.id === (defaultQuotationId ?? quotations[0]?.id));
    return initial?.balance ? String(initial.balance) : "";
  });
  const [method, setMethod] = useState("UPI");

  const options: ComboOption[] = useMemo(
    () =>
      quotations.map((item) => ({
        value: item.id,
        label: `${item.quotationNumber} — ${item.customerName}`,
        hint:
          item.balance > 0
            ? `${formatINR(item.balance)} outstanding of ${formatINR(item.total)}`
            : `Fully paid · ${formatINR(item.total)}`,
      })),
    [quotations],
  );

  function chooseQuotation(next: string) {
    setQuotationId(next);
    const target = quotations.find((item) => item.id === next);
    setAmount(target?.balance ? String(target.balance) : "");
  }

  const entered = Number(amount) || 0;
  const balance = selected?.balance ?? 0;
  const remaining = round(Math.max(0, balance - entered));
  const overpaying = entered > balance && balance >= 0;

  return (
    <form action={createPaymentAction} className="space-y-6">
      <Field label="Quotation" required>
        <Combobox
          name="quotationId"
          required
          options={options}
          value={quotationId}
          onChange={chooseQuotation}
          placeholder="Choose a quotation"
          searchPlaceholder="Search by number or customer…"
        />
      </Field>

      {selected ? (
        <div className="rounded-xl border border-border bg-surface/70 p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Figure label="Total" value={formatINR(selected.total)} />
            <Figure label="Already paid" value={formatINR(selected.paid)} />
            <Figure
              label="Outstanding"
              value={formatINR(balance)}
              tone={balance > 0 ? "warning" : "success"}
            />
          </div>
        </div>
      ) : null}

      <Field label="Amount received" required>
        <span className="relative block">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted">
            ₹
          </span>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className={cn(inputClass, "tabular pl-7 text-lg font-medium")}
          />
        </span>
      </Field>

      {balance > 0 ? (
        <div className="-mt-3 flex flex-wrap gap-2">
          <QuickAmount label="Full balance" onClick={() => setAmount(String(balance))} />
          <QuickAmount label="50%" onClick={() => setAmount(String(round(balance / 2)))} />
          <QuickAmount label="25%" onClick={() => setAmount(String(round(balance / 4)))} />
        </div>
      ) : null}

      {entered > 0 ? (
        <p
          className={cn(
            "rounded-lg px-3.5 py-2.5 text-sm",
            overpaying
              ? "bg-warning-soft text-warning"
              : remaining === 0
                ? "bg-success-soft text-success"
                : "bg-surface-sunken text-muted",
          )}
        >
          {overpaying
            ? `This is ${formatINR(entered - balance)} more than the outstanding balance.`
            : remaining === 0
              ? "This settles the quotation in full."
              : `${formatINR(remaining)} will remain outstanding.`}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Payment date" required>
          <input
            name="paymentDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
        </Field>
        <Field label="Reference number" hint="UPI ref, cheque no, etc.">
          <input name="referenceNumber" className={inputClass} placeholder="Optional" />
        </Field>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">Method</legend>
        <input type="hidden" name="paymentMethod" value={method} />
        <div className="flex flex-wrap gap-2">
          {METHODS.map((item) => {
            const active = method === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setMethod(item.value)}
                aria-pressed={active}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm transition",
                  active
                    ? "border-accent bg-accent-soft/70 font-medium text-accent-dark"
                    : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
                )}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Field label="Notes">
        <textarea name="notes" rows={2} className={inputClass} placeholder="Optional" />
      </Field>

      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
        <SubmitButton
          className="w-full sm:w-auto"
          pendingLabel="Recording…"
          icon={<Receipt className="size-4" />}
        >
          Record payment
        </SubmitButton>
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <FileText className="size-3.5" />
          A receipt PDF is generated automatically.
        </p>
      </div>
    </form>
  );
}

function Figure({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "success";
}) {
  return (
    <div>
      <p className="text-[0.6875rem] font-medium tracking-wide text-muted uppercase">{label}</p>
      <p
        className={cn(
          "tabular mt-0.5 text-base font-semibold",
          tone === "warning"
            ? "text-warning"
            : tone === "success"
              ? "text-success"
              : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function QuickAmount({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent hover:text-accent-dark"
    >
      {label}
    </button>
  );
}
