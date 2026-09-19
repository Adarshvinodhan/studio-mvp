import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/money";

export async function getQuotationBalance(quotationId: string) {
  const quotation = await prisma.quotation.findUniqueOrThrow({
    where: { id: quotationId },
    include: { payments: true },
  });
  const paid = quotation.payments.reduce((sum, p) => sum + toNumber(p.amount), 0);
  const total = toNumber(quotation.total);
  return {
    total,
    paid,
    balance: Math.max(0, Math.round((total - paid + Number.EPSILON) * 100) / 100),
    payments: quotation.payments,
  };
}
