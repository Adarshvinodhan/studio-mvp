"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  clearSessionCookieOptions,
  createSessionToken,
  sessionCookieOptions,
  validateCredentials,
} from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/") || "/";

  if (!validateCredentials(username, password)) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const token = await createSessionToken(username);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieOptions(token));
  redirect(next.startsWith("/") ? next : "/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.set(clearSessionCookieOptions());
  redirect("/login");
}
