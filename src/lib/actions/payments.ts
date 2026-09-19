"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { toNumber } from "@/lib/money";
import { nextReceiptNumber } from "@/lib/counters";
import { getQuotationBalance } from "@/lib/payments";
import { withFlash } from "@/lib/flash";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return v == null ? "" : String(v).trim();
}

function opt(formData: FormData, key: string) {
  const v = str(formData, key);
  return v || null;
}

export async function createPaymentAction(formData: FormData) {
  await requireSession();
  const quotationId = str(formData, "quotationId");
  const amount = toNumber(str(formData, "amount"));
  if (amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  const methodRaw = str(formData, "paymentMethod") || "UPI";
  const paymentMethod = (Object.values(PaymentMethod) as string[]).includes(methodRaw)
    ? (methodRaw as PaymentMethod)
    : PaymentMethod.OTHER;

  const dateStr = str(formData, "paymentDate") || new Date().toISOString().slice(0, 10);

  const payment = await prisma.payment.create({
    data: {
      quotationId,
      amount,
      paymentDate: new Date(dateStr),
      paymentMethod,
      referenceNumber: opt(formData, "referenceNumber"),
      notes: opt(formData, "notes"),
      receipt: {
        create: {
          receiptNumber: await nextReceiptNumber(),
        },
      },
    },
    include: { receipt: true, quotation: true },
  });

  const balance = await getQuotationBalance(quotationId);
  if (balance.balance <= 0 && payment.quotation.status === "ACCEPTED") {
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: "COMPLETED" },
    });
  } else if (
    payment.quotation.status === "DRAFT" ||
    payment.quotation.status === "SENT"
  ) {
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: "ACCEPTED" },
    });
  }

  revalidatePath("/payments");
  revalidatePath("/quotations");
  revalidatePath("/");
  revalidatePath(`/quotations/${quotationId}`);
  revalidatePath(`/customers/${payment.quotation.customerId}`);
  redirect(withFlash(`/payments?highlight=${payment.id}`, "payment-recorded"));
}

export async function deletePaymentAction(formData: FormData) {
  await requireSession();
  const id = str(formData, "id");
  const payment = await prisma.payment.findUniqueOrThrow({ where: { id } });
  await prisma.payment.delete({ where: { id } });
  revalidatePath("/payments");
  revalidatePath("/");
  revalidatePath(`/quotations/${payment.quotationId}`);
  redirect(withFlash("/payments", "payment-deleted"));
}
