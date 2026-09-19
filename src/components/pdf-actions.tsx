"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, Eye, RotateCcw } from "lucide-react";
import { buttonClass } from "@/components/button-styles";
import { Modal, ModalHeader } from "@/components/modal";
import { Spinner } from "@/components/spinner";

type PdfType = "catalogue" | "quotation" | "receipt";

function pdfUrl(type: PdfType, id: string, disposition?: "inline" | "attachment", bust?: number) {
  const params = new URLSearchParams({ type, id });
  if (disposition === "inline") params.set("disposition", "inline");
  if (bust) params.set("t", String(bust));
  return `/api/pdf?${params.toString()}`;
}

const linkClass = "text-sm text-accent hover:underline disabled:opacity-60";

export function PdfActions({
  type,
  id,
  variant = "buttons",
  previewLabel = "Preview PDF",
  downloadLabel = "Generate PDF",
  itemCount,
}: {
  type: PdfType;
  id: string;
  variant?: "buttons" | "links" | "compact";
  previewLabel?: string;
  downloadLabel?: string;
  /** Optional line-item count — shows a multi-page hint when large */
  itemCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const downloadHref = pdfUrl(type, id, "attachment");
  const previewBase = pdfUrl(type, id, "inline");

  const previewButtonClass =
    variant === "links" ? linkClass : buttonClass("secondary", variant === "compact" ? "sm" : "md");
  const downloadButtonClass =
    variant === "buttons"
      ? buttonClass("primary")
      : variant === "links"
        ? linkClass
        : buttonClass("secondary", "sm");

  return (
    <>
      <span className="inline-flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setOpen(true)} className={previewButtonClass}>
          {variant === "links" ? null : <Eye className="size-4" />}
          {previewLabel}
        </button>
        <a href={downloadHref} className={downloadButtonClass}>
          {variant === "links" ? null : <Download className="size-4" />}
          {downloadLabel}
        </a>
      </span>

      {open ? (
        <PdfPreviewModal
          previewBase={previewBase}
          downloadHref={downloadHref}
          title={previewLabel}
          itemCount={itemCount}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function PdfPreviewModal({
  previewBase,
  downloadHref,
  title,
  itemCount,
  onClose,
}: {
  previewBase: string;
  downloadHref: string;
  title: string;
  itemCount?: number;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(() => Date.now());
  const blobRef = useRef<string | null>(null);

  // Generating the PDF is a server round trip, so it runs on open and the
  // result lands via state once the request settles.
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function load() {
      try {
        const url = `${previewBase}${previewBase.includes("?") ? "&" : "?"}t=${retryKey}`;
        const res = await fetch(url, { signal, credentials: "same-origin" });

        if (!res.ok) {
          let message = "Could not generate PDF preview.";
          try {
            const data = (await res.json()) as { error?: string };
            if (data.error) message = data.error;
          } catch {
            // not JSON
          }
          throw new Error(message);
        }

        const contentType = res.headers.get("Content-Type") || "";
        if (!contentType.includes("pdf")) {
          throw new Error("Unexpected response — PDF was not returned.");
        }

        const pages = res.headers.get("X-PDF-Pages");
        if (pages) setPageCount(Number(pages));

        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        blobRef.current = objectUrl;
        setBlobUrl(objectUrl);
      } catch (err) {
        if (signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not load PDF preview.");
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    }

    void load();

    return () => {
      controller.abort();
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }
    };
  }, [previewBase, retryKey]);

  const openInNewTab = () => {
    if (blobUrl) window.open(blobUrl, "_blank", "noopener,noreferrer");
  };

  /** Resets here rather than inside `loadPdf`, which the effect calls. */
  const retry = () => {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
    setBlobUrl(null);
    setPageCount(null);
    setError(null);
    setLoading(true);
    setRetryKey(Date.now());
  };

  const longContentHint =
    itemCount != null && itemCount > 12
      ? "This document has many line items and may span multiple pages."
      : null;

  return (
    <Modal
      label={title}
      onClose={onClose}
      className="h-[100dvh] max-w-5xl sm:h-[min(92vh,920px)]"
    >
      <ModalHeader
        eyebrow={
          pageCount != null && !loading && !error
            ? `Preview · ${pageCount} page${pageCount === 1 ? "" : "s"}`
            : "Preview"
        }
        title={title}
        onClose={onClose}
      >
        <button
          type="button"
          onClick={openInNewTab}
          disabled={!blobUrl}
          className={buttonClass("secondary", "sm")}
        >
          <ExternalLink className="size-4" />
          Open in tab
        </button>
        <a href={downloadHref} className={buttonClass("primary", "sm")}>
          <Download className="size-4" />
          Download
        </a>
      </ModalHeader>

      {longContentHint ? (
        <p className="border-b border-border bg-warning-soft px-4 py-2 text-xs text-warning">
          {longContentHint} Review before sending to the client.
        </p>
      ) : null}

      <div className="relative min-h-0 flex-1 bg-surface-sunken">
        {loading ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-sm text-muted">
            <Spinner className="size-6 text-accent" />
            <span>Generating PDF…</span>
            <span className="text-xs">This may take a few seconds</span>
          </div>
        ) : null}

        {error ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-danger">{error}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={retry} className={buttonClass("primary")}>
                <RotateCcw className="size-4" />
                Retry
              </button>
              <a href={downloadHref} className={buttonClass("secondary")}>
                Download instead
              </a>
            </div>
          </div>
        ) : null}

        {blobUrl && !error ? (
          <iframe title={title} src={blobUrl} className="h-full w-full border-0" />
        ) : null}
      </div>
    </Modal>
  );
}
