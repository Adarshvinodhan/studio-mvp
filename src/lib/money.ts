import { Decimal } from "@prisma/client/runtime/library";

export type MoneyInput = number | string | Decimal;

/**
 * Accepts `unknown` because Prisma `Decimal` columns surface loosely typed in
 * the PDF templates; anything unrecognised is treated as zero.
 */
export function toNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") return Number(value) || 0;
  if (
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  ) {
    return (value as Decimal).toNumber();
  }
  return 0;
}

export function formatINR(value: unknown): string {
  const n = toNumber(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatINRExact(value: unknown): string {
  const n = toNumber(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function lineTotal(quantity: unknown, unitPrice: unknown): number {
  return roundMoney(toNumber(quantity) * toNumber(unitPrice));
}

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calcQuotationTotals(
  items: { quantity: unknown; unitPrice: unknown }[],
  discount: unknown = 0,
  tax: unknown = 0,
) {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + lineTotal(item.quantity, item.unitPrice), 0),
  );
  const discountN = toNumber(discount);
  const taxN = toNumber(tax);
  const total = roundMoney(Math.max(0, subtotal - discountN + taxN));
  return { subtotal, discount: discountN, tax: taxN, total };
}
