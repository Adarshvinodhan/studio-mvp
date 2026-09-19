"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { FLASH_MESSAGES, FLASH_PARAM } from "@/lib/flash";

export function FlashToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastShown = useRef<string | null>(null);

  useEffect(() => {
    const key = searchParams.get(FLASH_PARAM);
    if (!key) {
      lastShown.current = null;
      return;
    }

    const signature = `${pathname}?${searchParams.toString()}`;
    if (lastShown.current === signature) return;
    lastShown.current = signature;

    const message = FLASH_MESSAGES[key];
    if (message) {
      const notify = message.tone === "error" ? toast.error : toast.success;
      notify(message.title, { description: message.description });
    }

    // Drop the param so a refresh or back-navigation doesn't replay the toast.
    const next = new URLSearchParams(searchParams);
    next.delete(FLASH_PARAM);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}
