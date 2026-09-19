"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { withFlash } from "@/lib/flash";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return v == null ? "" : String(v).trim();
}

function opt(formData: FormData, key: string) {
  const v = str(formData, key);
  return v || null;
}

export async function createCustomerAction(formData: FormData) {
  await requireSession();
  const customer = await prisma.customer.create({
    data: {
      name: str(formData, "name"),
      phone: opt(formData, "phone"),
      whatsapp: opt(formData, "whatsapp"),
      email: opt(formData, "email"),
      address: opt(formData, "address"),
      notes: opt(formData, "notes"),
    },
  });
  revalidatePath("/customers");
  redirect(withFlash(`/customers/${customer.id}`, "customer-created"));
}

export async function updateCustomerAction(formData: FormData) {
  await requireSession();
  const id = str(formData, "id");
  await prisma.customer.update({
    where: { id },
    data: {
      name: str(formData, "name"),
      phone: opt(formData, "phone"),
      whatsapp: opt(formData, "whatsapp"),
      email: opt(formData, "email"),
      address: opt(formData, "address"),
      notes: opt(formData, "notes"),
    },
  });
  revalidatePath(`/customers/${id}`);
  revalidatePath("/customers");
  redirect(withFlash(`/customers/${id}`, "customer-saved"));
}

export async function deleteCustomerAction(formData: FormData) {
  await requireSession();
  const id = str(formData, "id");
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/customers");
  redirect(withFlash("/customers", "customer-deleted"));
}

export async function createEventAction(formData: FormData) {
  await requireSession();
  const customerId = str(formData, "customerId");
  const dateStr = opt(formData, "eventDate");
  await prisma.event.create({
    data: {
      customerId,
      name: str(formData, "name"),
      type: opt(formData, "type"),
      eventDate: dateStr ? new Date(dateStr) : null,
      location: opt(formData, "location"),
      notes: opt(formData, "notes"),
    },
  });
  revalidatePath(`/customers/${customerId}`);
  redirect(withFlash(`/customers/${customerId}`, "event-added"));
}

export async function updateEventAction(formData: FormData) {
  await requireSession();
  const id = str(formData, "id");
  const customerId = str(formData, "customerId");
  const dateStr = opt(formData, "eventDate");
  await prisma.event.update({
    where: { id },
    data: {
      name: str(formData, "name"),
      type: opt(formData, "type"),
      eventDate: dateStr ? new Date(dateStr) : null,
      location: opt(formData, "location"),
      notes: opt(formData, "notes"),
    },
  });
  revalidatePath(`/customers/${customerId}`);
  redirect(withFlash(`/customers/${customerId}`, "event-added"));
}

export async function deleteEventAction(formData: FormData) {
  await requireSession();
  const id = str(formData, "id");
  const customerId = str(formData, "customerId");
  await prisma.event.delete({ where: { id } });
  revalidatePath(`/customers/${customerId}`);
  redirect(withFlash(`/customers/${customerId}`, "event-deleted"));
}
