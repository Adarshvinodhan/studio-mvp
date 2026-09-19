"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { buttonClass } from "@/components/button-styles";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-xl border border-border bg-card/90 px-6 py-14 text-center shadow-card">
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle className="size-6" />
      </span>
      <div>
        <h1 className="font-display text-2xl text-foreground">
          Something went wrong
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {error.message || "That action could not be completed."}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={reset} className={buttonClass("primary")}>
          <RotateCcw className="size-4" />
          Try again
        </button>
        <Link href="/" className={buttonClass("secondary")}>
          Back to dashboard
        </Link>
      </div>
      {error.digest ? (
        <p className="text-xs text-muted/70">Reference: {error.digest}</p>
      ) : null}
    </div>
  );
}
