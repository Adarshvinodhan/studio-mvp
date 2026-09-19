import { toNumber, type MoneyInput } from "@/lib/money";

export type PaymentFilter = "all" | "pending" | "paid" | "partial" | "unpaid";

export type QuotationFilterParams = {
  q?: string;
  payment?: string;
  status?: string;
};

export const PAYMENT_FILTERS: { value: PaymentFilter; label: string }[] = [
  { value: "all", label: "All payments" },
  { value: "pending", label: "Pending balance" },
  { value: "partial", label: "Partial payment" },
  { value: "paid", label: "Fully paid" },
  { value: "unpaid", label: "No payment yet" },
];

export const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "COMPLETED", label: "Completed" },
] as const;

/**
 * Statuses that represent a real billing expectation. A DRAFT hasn't been put
 * in front of the client yet and a REJECTED offer is dead, so neither belongs
 * in outstanding totals, follow-up lists or the payment picker.
 */
export const BILLABLE_STATUSES = ["SENT", "ACCEPTED", "COMPLETED"] as const;

export function isBillableStatus(status: string): boolean {
  return (BILLABLE_STATUSES as readonly string[]).includes(status);
}

export function parsePaymentFilter(value?: string): PaymentFilter {
  if (
    value === "pending" ||
    value === "paid" ||
    value === "partial" ||
    value === "unpaid"
  ) {
    return value;
  }
  return "all";
}

export function quotationPaidBalance(
  total: MoneyInput,
  payments: { amount: MoneyInput }[],
) {
  const paid = payments.reduce((sum, p) => sum + toNumber(p.amount), 0);
  const totalN = toNumber(total);
  const balance = Math.max(0, Math.round((totalN - paid + Number.EPSILON) * 100) / 100);
  return { paid, balance, total: totalN };
}

export function matchesPaymentFilter(
  filter: PaymentFilter,
  quotation: {
    status: string;
    total: MoneyInput;
    payments: { amount: MoneyInput }[];
  },
): boolean {
  if (filter === "all") return true;
  // Payment filters only describe billable quotations.
  if (!isBillableStatus(quotation.status)) return false;

  const { paid, balance } = quotationPaidBalance(quotation.total, quotation.payments);
  switch (filter) {
    case "pending":
      return balance > 0;
    case "paid":
      return balance <= 0;
    case "partial":
      return paid > 0 && balance > 0;
    case "unpaid":
      return paid <= 0 && balance > 0;
    default:
      return true;
  }
}

export function matchesSearchQuery<
  T extends {
    quotationNumber: string;
    customer: { name: string; phone?: string | null };
    event?: { name: string } | null;
  },
>(quotation: T, q?: string): boolean {
  if (!q?.trim()) return true;
  const needle = q.trim().toLowerCase();
  return (
    quotation.quotationNumber.toLowerCase().includes(needle) ||
    quotation.customer.name.toLowerCase().includes(needle) ||
    (quotation.customer.phone ?? "").toLowerCase().includes(needle) ||
    (quotation.event?.name ?? "").toLowerCase().includes(needle)
  );
}
