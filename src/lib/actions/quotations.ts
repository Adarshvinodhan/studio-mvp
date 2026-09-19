"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { QuotationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { calcQuotationTotals, lineTotal, roundMoney, toNumber } from "@/lib/money";
import { getBusinessSettings, nextQuotationNumber } from "@/lib/counters";
import { withFlash } from "@/lib/flash";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return v == null ? "" : String(v).trim();
}

function opt(formData: FormData, key: string) {
  const v = str(formData, key);
  return v || null;
}

function num(formData: FormData, key: string) {
  return toNumber(str(formData, key) || "0");
}

export async function createQuotationAction(formData: FormData) {
  await requireSession();
  const customerId = str(formData, "customerId");
  const eventId = opt(formData, "eventId");
  const packageId = opt(formData, "packageId");
  const settings = await getBusinessSettings();

  let items: {
    name: string;
    description: string | null;
    category: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    sortOrder: number;
  }[] = [];

  if (packageId) {
    const pkg = await prisma.package.findUniqueOrThrow({
      where: { id: packageId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
    items = pkg.items.map((item, idx) => {
      const quantity = toNumber(item.quantity);
      const unitPrice = toNumber(item.unitPrice);
      return {
        name: item.name,
        description: item.description,
        category: item.category,
        quantity,
        unitPrice,
        lineTotal: lineTotal(quantity, unitPrice),
        sortOrder: item.sortOrder || idx + 1,
      };
    });
  }

  const totals = calcQuotationTotals(items, 0, 0);
  const quotation = await prisma.quotation.create({
    data: {
      quotationNumber: await nextQuotationNumber(settings.quotationPrefix),
      customerId,
      eventId,
      packageId,
      status: "DRAFT",
      issuedDate: new Date(),
      subtotal: totals.subtotal,
      discount: 0,
      tax: 0,
      total: totals.total,
      terms: settings.defaultTerms,
      items: { create: items },
    },
  });

  revalidatePath("/quotations");
  redirect(withFlash(`/quotations/${quotation.id}`, "quotation-created"));
}

/**
 * Status, event and the text blocks. Money lives in `saveQuotationItemsAction`
 * so discount/tax only ever have one owner.
 */
export async function updateQuotationMetaAction(formData: FormData) {
  await requireSession();
  const id = str(formData, "id");
  const status = str(formData, "status") as QuotationStatus;
  const notes = opt(formData, "notes");
  const terms = opt(formData, "terms");
  const eventId = opt(formData, "eventId");

  const existing = await prisma.quotation.findUniqueOrThrow({ where: { id } });

  await prisma.quotation.update({
    where: { id },
    data: {
      status: Object.values(QuotationStatus).includes(status) ? status : existing.status,
      eventId,
      notes,
      terms,
    },
  });

  revalidatePath(`/quotations/${id}`);
  revalidatePath("/quotations");
  revalidatePath("/");
  redirect(withFlash(`/quotations/${id}`, "quotation-saved"));
}

/**
 * Promotes a draft to SENT, which is what makes it count as a real offer:
 * outstanding totals, follow-ups and the payment picker all ignore drafts.
 */
export async function activateQuotationAction(formData: FormData) {
  await requireSession();
  const id = str(formData, "id");
  const quotation = await prisma.quotation.findUniqueOrThrow({ where: { id } });

  if (quotation.status === "DRAFT") {
    await prisma.quotation.update({
      where: { id },
      data: { status: "SENT", issuedDate: quotation.issuedDate ?? new Date() },
    });
  }

  revalidatePath(`/quotations/${id}`);
  revalidatePath("/quotations");
  revalidatePath("/payments");
  revalidatePath("/");
  redirect(withFlash(`/quotations/${id}`, "quotation-activated"));
}

/** Inline status change from the quotation header — no form round trip. */
export async function setQuotationStatusAction(id: string, status: string) {
  await requireSession();
  if (!(Object.values(QuotationStatus) as string[]).includes(status)) return;
  await prisma.quotation.update({
    where: { id },
    data: { status: status as QuotationStatus },
  });
  revalidatePath(`/quotations/${id}`);
  revalidatePath("/quotations");
  revalidatePath("/");
}

export type QuotationItemInput = {
  id?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  quantity: number;
  unitPrice: number;
};

/**
 * Replaces the whole line-item set in one shot: the editor keeps rows in local
 * state so adding, editing, reordering and removing is a single save.
 */
export async function saveQuotationItemsAction(
  quotationId: string,
  input: { discount: number; tax: number; items: QuotationItemInput[] },
) {
  await requireSession();

  const quotation = await prisma.quotation.findUniqueOrThrow({
    where: { id: quotationId },
    include: { items: { select: { id: true } } },
  });

  const rows = input.items
    .map((item, index) => {
      const quantity = roundMoney(Number(item.quantity) || 0);
      const unitPrice = roundMoney(Number(item.unitPrice) || 0);
      return {
        id: item.id || null,
        name: (item.name || "").trim() || "Untitled item",
        description: item.description?.trim() || null,
        category: item.category?.trim() || null,
        quantity,
        unitPrice,
        lineTotal: lineTotal(quantity, unitPrice),
        sortOrder: index + 1,
      };
    })
    .filter((row) => row.name.length > 0);

  const keptIds = new Set(rows.map((row) => row.id).filter(Boolean) as string[]);
  const removedIds = quotation.items
    .map((item) => item.id)
    .filter((id) => !keptIds.has(id));

  const totals = calcQuotationTotals(rows, input.discount, input.tax);

  await prisma.$transaction([
    ...(removedIds.length
      ? [prisma.quotationItem.deleteMany({ where: { id: { in: removedIds } } })]
      : []),
    ...rows
      .filter((row) => row.id)
      .map((row) =>
        prisma.quotationItem.update({
          where: { id: row.id! },
          data: {
            name: row.name,
            description: row.description,
            category: row.category,
            quantity: row.quantity,
            unitPrice: row.unitPrice,
            lineTotal: row.lineTotal,
            sortOrder: row.sortOrder,
          },
        }),
      ),
    ...rows
      .filter((row) => !row.id)
      .map((row) =>
        prisma.quotationItem.create({
          data: {
            quotationId,
            name: row.name,
            description: row.description,
            category: row.category,
            quantity: row.quantity,
            unitPrice: row.unitPrice,
            lineTotal: row.lineTotal,
            sortOrder: row.sortOrder,
          },
        }),
      ),
    prisma.quotation.update({
      where: { id: quotationId },
      data: {
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
      },
    }),
  ]);

  revalidatePath(`/quotations/${quotationId}`);
  revalidatePath("/quotations");
  revalidatePath("/payments");
  revalidatePath("/");

  return { ok: true as const, total: totals.total };
}

export async function deleteQuotationAction(formData: FormData) {
  await requireSession();
  const id = str(formData, "id");
  await prisma.quotation.delete({ where: { id } });
  revalidatePath("/quotations");
  revalidatePath("/");
  redirect(withFlash("/quotations", "quotation-deleted"));
}

/** Kept for progressive-enhancement fallbacks and single-item flows. */
export async function addQuotationItemAction(formData: FormData) {
  await requireSession();
  const quotationId = str(formData, "quotationId");
  const quantity = num(formData, "quantity") || 1;
  const unitPrice = num(formData, "unitPrice");
  const max = await prisma.quotationItem.aggregate({
    where: { quotationId },
    _max: { sortOrder: true },
  });
  await prisma.quotationItem.create({
    data: {
      quotationId,
      name: str(formData, "name") || "New item",
      description: opt(formData, "description"),
      category: opt(formData, "category"),
      quantity,
      unitPrice,
      lineTotal: lineTotal(quantity, unitPrice),
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  await recalcQuotation(quotationId);
  revalidatePath(`/quotations/${quotationId}`);
  redirect(withFlash(`/quotations/${quotationId}`, "item-added"));
}

async function recalcQuotation(quotationId: string) {
  const quotation = await prisma.quotation.findUniqueOrThrow({
    where: { id: quotationId },
    include: { items: true },
  });
  const totals = calcQuotationTotals(
    quotation.items,
    quotation.discount,
    quotation.tax,
  );
  await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      subtotal: totals.subtotal,
      total: totals.total,
    },
  });
}
