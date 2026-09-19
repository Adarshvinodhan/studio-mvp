import { prisma } from "@/lib/prisma";

export async function nextQuotationNumber(prefix = "CAM"): Promise<string> {
  const year = new Date().getFullYear();
  const key = `quotation_${year}`;
  const counter = await prisma.counter.upsert({
    where: { id: key },
    create: { id: key, value: 1 },
    update: { value: { increment: 1 } },
  });
  const seq = String(counter.value).padStart(3, "0");
  return `${prefix}-${seq}-${year}`;
}

export async function nextReceiptNumber(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { id: "receipt" },
    create: { id: "receipt", value: 1 },
    update: { value: { increment: 1 } },
  });
  return `REC-${String(counter.value).padStart(4, "0")}`;
}

export async function getBusinessSettings() {
  let settings = await prisma.businessSettings.findFirst();
  if (!settings) {
    settings = await prisma.businessSettings.create({
      data: {
        businessName: "Camtrio Weddings",
      },
    });
  }
  return settings;
}
