import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonClass } from "@/components/button-styles";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
        <Compass className="size-7" />
      </span>
      <div>
        <h1 className="font-display text-3xl text-foreground">
          Page not found
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          The page you were looking for doesn&apos;t exist or has been removed.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/" className={buttonClass("primary")}>
          Back to dashboard
        </Link>
        <Link href="/quotations" className={buttonClass("secondary")}>
          View quotations
        </Link>
      </div>
    </div>
  );
}
