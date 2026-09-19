/**
 * Server actions redirect with a `?flash=<key>` param; the client shell turns
 * that key into a toast and strips it from the URL. Keys keep URLs tidy and
 * the copy in one place.
 */
type FlashMessage = {
  tone: "success" | "error" | "info";
  title: string;
  description?: string;
};

const MESSAGES = {
  "customer-created": { tone: "success", title: "Customer added" },
  "customer-saved": { tone: "success", title: "Profile saved" },
  "customer-deleted": { tone: "success", title: "Customer deleted" },
  "event-added": { tone: "success", title: "Event added" },
  "event-deleted": { tone: "success", title: "Event removed" },
  "quotation-created": {
    tone: "success",
    title: "Quotation created",
    description: "Add or adjust line items, then share the PDF.",
  },
  "quotation-saved": { tone: "success", title: "Quotation saved" },
  "quotation-activated": {
    tone: "success",
    title: "Quotation activated",
    description: "It now counts towards outstanding balances and follow-ups.",
  },
  "quotation-deleted": { tone: "success", title: "Quotation deleted" },
  "items-saved": { tone: "success", title: "Line items saved" },
  "item-added": { tone: "success", title: "Item added" },
  "item-deleted": { tone: "success", title: "Item removed" },
  "payment-recorded": {
    tone: "success",
    title: "Payment recorded",
    description: "A receipt was generated automatically.",
  },
  "payment-deleted": { tone: "success", title: "Payment deleted" },
  "catalogue-created": { tone: "success", title: "Catalogue created" },
  "catalogue-saved": { tone: "success", title: "Catalogue saved" },
  "catalogue-deleted": { tone: "success", title: "Catalogue deleted" },
  "catalogue-duplicated": {
    tone: "success",
    title: "Catalogue duplicated",
    description: "Rename the copy and adjust its items.",
  },
  "settings-saved": { tone: "success", title: "Settings saved" },
  "image-uploaded": { tone: "success", title: "Image uploaded" },
  "image-deleted": { tone: "success", title: "Image removed" },
  "upload-failed": { tone: "error", title: "Upload failed", description: "Try a smaller image." },
} satisfies Record<string, FlashMessage>;

export const FLASH_MESSAGES: Record<string, FlashMessage> = MESSAGES;

export type FlashKey = keyof typeof MESSAGES;

export const FLASH_PARAM = "flash";

/** Append a flash key to a redirect target, preserving existing query params. */
export function withFlash(path: string, key: FlashKey) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${FLASH_PARAM}=${key}`;
}
