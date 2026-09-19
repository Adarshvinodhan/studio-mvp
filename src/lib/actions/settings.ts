"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getBusinessSettings } from "@/lib/counters";
import { deleteUpload, putUpload } from "@/lib/uploads";
import { withFlash } from "@/lib/flash";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return v == null ? "" : String(v).trim();
}

function opt(formData: FormData, key: string) {
  const v = str(formData, key);
  return v || null;
}

export async function updateSettingsAction(formData: FormData) {
  await requireSession();
  const settings = await getBusinessSettings();

  let logo = settings.logo;
  const file = formData.get("logo");
  if (file && file instanceof File && file.size > 0) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || ".png";
    const fileName = `logo-${Date.now()}${ext}`;
    logo = await putUpload(`logos/${fileName}`, bytes, file.type || undefined);
  }

  await prisma.businessSettings.update({
    where: { id: settings.id },
    data: {
      businessName: str(formData, "businessName") || "Camtrio Weddings",
      address: opt(formData, "address"),
      phone: opt(formData, "phone"),
      email: opt(formData, "email"),
      bankHolderName: opt(formData, "bankHolderName"),
      bankAccountNumber: opt(formData, "bankAccountNumber"),
      ifsc: opt(formData, "ifsc"),
      upiNumber: opt(formData, "upiNumber"),
      defaultTerms: opt(formData, "defaultTerms"),
      quotationPrefix: str(formData, "quotationPrefix") || "CAM",
      logo,
    },
  });

  revalidatePath("/settings");
  redirect(withFlash("/settings", "settings-saved"));
}

export async function uploadPortfolioImageAction(formData: FormData) {
  await requireSession();
  const file = formData.get("image");
  if (!file || !(file instanceof File) || file.size === 0) {
    redirect(withFlash("/settings", "upload-failed"));
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".jpg";
  const fileName = `img-${Date.now()}${ext}`;
  const filePath = await putUpload(
    `portfolio/${fileName}`,
    bytes,
    file.type || undefined,
  );

  const max = await prisma.portfolioImage.aggregate({ _max: { sortOrder: true } });
  await prisma.portfolioImage.create({
    data: {
      name: file.name,
      filePath,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath("/settings");
  redirect(withFlash("/settings", "image-uploaded"));
}

export async function deletePortfolioImageAction(formData: FormData) {
  await requireSession();
  const id = str(formData, "id");
  const image = await prisma.portfolioImage.findUnique({ where: { id } });
  if (image) {
    await prisma.portfolioImage.delete({ where: { id } });
    try {
      await deleteUpload(image.filePath);
    } catch {
      // ignore missing file
    }
  }
  revalidatePath("/settings");
  redirect(withFlash("/settings", "image-deleted"));
}
