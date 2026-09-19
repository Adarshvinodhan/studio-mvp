"use server";

import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getBusinessSettings } from "@/lib/counters";
import { toNumber } from "@/lib/money";
import { htmlToPdf } from "@/lib/pdf/generate";
import {
  renderCatalogueHtml,
  renderQuotationHtml,
  renderReceiptHtml,
} from "@/lib/pdf/templates";
function fmtDate(d: Date | null | undefined) {
  if (!d) return null;
  return format(d, "MMMM d, yyyy");
}

export async function generateCataloguePdf(packageId: string) {
  await requireSession();
  const settings = await getBusinessSettings();
  const pkg = await prisma.package.findUniqueOrThrow({
    where: { id: packageId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  const html = renderCatalogueHtml({
    settings,
    packageName: pkg.name,
    packageDescription: pkg.description,
    basePrice: pkg.basePrice,
    items: pkg.items,
    terms: settings.defaultTerms,
  });

  return htmlToPdf(html, `catalogue-${pkg.id}.pdf`);
}

export async function generateQuotationPdf(quotationId: string) {
  await requireSession();
  const settings = await getBusinessSettings();
  const quotation = await prisma.quotation.findUniqueOrThrow({
    where: { id: quotationId },
    include: {
      customer: true,
      event: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  const html = renderQuotationHtml({
    settings,
    quotationNumber: quotation.quotationNumber,
    customerName: quotation.customer.name,
    customerContact: quotation.customer.phone || quotation.customer.whatsapp,
    customerAddress: quotation.customer.address,
    eventName: quotation.event?.name,
    eventLocation: quotation.event?.location,
    eventDate: fmtDate(quotation.event?.eventDate),
    issuedDate: fmtDate(quotation.issuedDate),
    items: quotation.items,
    subtotal: quotation.subtotal,
    discount: quotation.discount,
    tax: quotation.tax,
    total: quotation.total,
    terms: quotation.terms || settings.defaultTerms,
  });

  return htmlToPdf(html, `quotation-${quotation.quotationNumber}.pdf`);
}

export async function generateReceiptPdf(paymentId: string) {
  await requireSession();
  const settings = await getBusinessSettings();
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: {
      receipt: true,
      quotation: { include: { customer: true, payments: { orderBy: { paymentDate: "asc" } } } },
    },
  });

  if (!payment.receipt) {
    throw new Error("Receipt record missing");
  }

  const previousPayments = payment.quotation.payments.filter(
    (p) =>
      p.id !== payment.id &&
      (p.paymentDate < payment.paymentDate ||
        (p.paymentDate.getTime() === payment.paymentDate.getTime() &&
          p.createdAt < payment.createdAt)),
  );
  const previouslyPaid = previousPayments.reduce((s, p) => s + toNumber(p.amount), 0);
  const totalPaid = previouslyPaid + toNumber(payment.amount);

  const html = renderReceiptHtml({
    settings,
    receiptNumber: payment.receipt.receiptNumber,
    customerName: payment.quotation.customer.name,
    quotationNumber: payment.quotation.quotationNumber,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod.replace("_", " "),
    paymentDate: fmtDate(payment.paymentDate) || "",
    quotationTotal: payment.quotation.total,
    previouslyPaid,
    totalPaid,
    balance: Math.max(0, toNumber(payment.quotation.total) - totalPaid),
  });

  const result = await htmlToPdf(html, `receipt-${payment.receipt.receiptNumber}.pdf`);
  await prisma.receipt.update({
    where: { id: payment.receipt.id },
    data: { pdfPath: result.relativePath, generatedAt: new Date() },
  });

  return result;
}
