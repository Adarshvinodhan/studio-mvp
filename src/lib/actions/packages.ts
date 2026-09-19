"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { roundMoney, toNumber } from "@/lib/money";
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

export async function createPackageAction(formData: FormData) {
  await requireSession();
  const pkg = await prisma.package.create({
    data: {
      name: str(formData, "name"),
      description: opt(formData, "description"),
      basePrice: num(formData, "basePrice"),
      status: "ACTIVE",
    },
  });
  revalidatePath("/catalogues");
  redirect(withFlash(`/catalogues/${pkg.id}`, "catalogue-created"));
}

export async function updatePackageAction(formData: FormData) {
  await requireSession();
  const id = str(formData, "id");
  await prisma.package.update({
    where: { id },
    data: {
      name: str(formData, "name"),
      description: opt(formData, "description"),
      status: str(formData, "status") === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
    },
  });
  revalidatePath(`/catalogues/${id}`);
  revalidatePath("/catalogues");
  redirect(withFlash(`/catalogues/${id}`, "catalogue-saved"));
}

export async function duplicatePackageAction(formData: FormData) {
  await requireSession();
  const id = str(formData, "id");
  const source = await prisma.package.findUniqueOrThrow({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  const copy = await prisma.package.create({
    data: {
      name: `${source.name} (Copy)`,
      description: source.description,
      basePrice: source.basePrice,
      status: "ACTIVE",
      items: {
        create: source.items.map((item) => ({
          name: item.name,
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          sortOrder: item.sortOrder,
        })),
      },
    },
  });
  revalidatePath("/catalogues");
  redirect(withFlash(`/catalogues/${copy.id}`, "catalogue-duplicated"));
}

export async function deletePackageAction(formData: FormData) {
  await requireSession();
  const id = str(formData, "id");
  await prisma.package.delete({ where: { id } });
  revalidatePath("/catalogues");
  redirect(withFlash("/catalogues", "catalogue-deleted"));
}

export type PackageItemInput = {
  id?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  quantity: number;
  unitPrice: number;
};

/**
 * Bulk replace of catalogue items, mirroring the quotation item editor. The
 * shared editor always sends discount/tax; catalogues have no such fields, so
 * they are ignored here and base price stays derived from the items.
 */
export async function savePackageItemsAction(
  packageId: string,
  input: { items: PackageItemInput[] },
) {
  await requireSession();

  const pkg = await prisma.package.findUniqueOrThrow({
    where: { id: packageId },
    include: { items: { select: { id: true } } },
  });

  const rows = input.items.map((item, index) => {
    const quantity = roundMoney(Number(item.quantity) || 0);
    const unitPrice = roundMoney(Number(item.unitPrice) || 0);
    return {
      id: item.id || null,
      name: (item.name || "").trim() || "Untitled item",
      description: item.description?.trim() || null,
      category: item.category?.trim() || null,
      quantity,
      unitPrice,
      sortOrder: index + 1,
    };
  });

  const keptIds = new Set(rows.map((row) => row.id).filter(Boolean) as string[]);
  const removedIds = pkg.items.map((item) => item.id).filter((id) => !keptIds.has(id));
  const basePrice = roundMoney(
    rows.reduce((sum, row) => sum + row.quantity * row.unitPrice, 0),
  );

  await prisma.$transaction([
    ...(removedIds.length
      ? [prisma.packageItem.deleteMany({ where: { id: { in: removedIds } } })]
      : []),
    ...rows
      .filter((row) => row.id)
      .map((row) =>
        prisma.packageItem.update({
          where: { id: row.id! },
          data: {
            name: row.name,
            description: row.description,
            category: row.category,
            quantity: row.quantity,
            unitPrice: row.unitPrice,
            sortOrder: row.sortOrder,
          },
        }),
      ),
    ...rows
      .filter((row) => !row.id)
      .map((row) =>
        prisma.packageItem.create({
          data: {
            packageId,
            name: row.name,
            description: row.description,
            category: row.category,
            quantity: row.quantity,
            unitPrice: row.unitPrice,
            sortOrder: row.sortOrder,
          },
        }),
      ),
    prisma.package.update({
      where: { id: packageId },
      data: { basePrice },
    }),
  ]);

  revalidatePath(`/catalogues/${packageId}`);
  revalidatePath("/catalogues");

  return { ok: true as const, basePrice };
}

export async function addPackageItemAction(formData: FormData) {
  await requireSession();
  const packageId = str(formData, "packageId");
  const max = await prisma.packageItem.aggregate({
    where: { packageId },
    _max: { sortOrder: true },
  });
  await prisma.packageItem.create({
    data: {
      packageId,
      name: str(formData, "name") || "New item",
      description: opt(formData, "description"),
      category: opt(formData, "category"),
      quantity: num(formData, "quantity") || 1,
      unitPrice: num(formData, "unitPrice"),
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  // Recalc base price as sum of line totals
  await recalcPackageBasePrice(packageId);
  revalidatePath(`/catalogues/${packageId}`);
  redirect(`/catalogues/${packageId}`);
}

export async function updatePackageItemAction(formData: FormData) {
  await requireSession();
  const id = str(formData, "id");
  const packageId = str(formData, "packageId");
  await prisma.packageItem.update({
    where: { id },
    data: {
      name: str(formData, "name"),
      description: opt(formData, "description"),
      category: opt(formData, "category"),
      quantity: num(formData, "quantity") || 1,
      unitPrice: num(formData, "unitPrice"),
      sortOrder: Math.round(num(formData, "sortOrder")),
    },
  });
  await recalcPackageBasePrice(packageId);
  revalidatePath(`/catalogues/${packageId}`);
  redirect(`/catalogues/${packageId}`);
}

export async function deletePackageItemAction(formData: FormData) {
  await requireSession();
  const id = str(formData, "id");
  const packageId = str(formData, "packageId");
  await prisma.packageItem.delete({ where: { id } });
  await recalcPackageBasePrice(packageId);
  revalidatePath(`/catalogues/${packageId}`);
  redirect(`/catalogues/${packageId}`);
}

async function recalcPackageBasePrice(packageId: string) {
  const items = await prisma.packageItem.findMany({ where: { packageId } });
  const base = items.reduce(
    (sum, item) => sum + toNumber(item.quantity) * toNumber(item.unitPrice),
    0,
  );
  await prisma.package.update({
    where: { id: packageId },
    data: { basePrice: Math.round(base * 100) / 100 },
  });
}
