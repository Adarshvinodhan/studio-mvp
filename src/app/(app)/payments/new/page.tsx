import Link from "next/link";
import { FileText, PencilLine } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/money";
import { BILLABLE_STATUSES } from "@/lib/quotation-filters";
import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { NewPaymentForm, type QuotationChoice } from "@/components/new-payment-form";

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ quotationId?: string }>;
}) {
  const { quotationId } = await searchParams;

  // Only billable quotations can take a payment — a draft hasn't been offered
  // to the client yet, and a rejected one never will be.
  const [quotations, draftCount] = await Promise.all([
    prisma.quotation.findMany({
      where: { status: { in: [...BILLABLE_STATUSES] } },
      orderBy: { updatedAt: "desc" },
      include: { customer: true, payments: true },
    }),
    prisma.quotation.count({ where: { status: "DRAFT" } }),
  ]);

  const choices: QuotationChoice[] = quotations.map((quotation) => {
    const total = toNumber(quotation.total);
    const paid = quotation.payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
    return {
      id: quotation.id,
      quotationNumber: quotation.quotationNumber,
      customerName: quotation.customer.name,
      total,
      paid,
      balance: Math.max(0, Math.round((total - paid) * 100) / 100),
    };
  });

  const draftNotice =
    draftCount > 0 ? (
      <p className="mt-4 flex items-start gap-2.5 rounded-lg border border-border bg-surface/70 px-3.5 py-2.5 text-xs text-muted">
        <PencilLine className="mt-0.5 size-3.5 shrink-0" />
        <span>
          {draftCount} draft quotation{draftCount === 1 ? " is" : "s are"} hidden here.{" "}
          <Link
            href="/quotations?status=DRAFT"
            className="text-accent underline-offset-2 hover:underline"
          >
            Activate a draft
          </Link>{" "}
          to record payments against it.
        </span>
      </p>
    ) : null;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        breadcrumbs={[{ label: "Payments", href: "/payments" }, { label: "Record" }]}
        title="Record payment"
        description="Each payment is a separate transaction against an active quotation."
      />
      <Card>
        {choices.length === 0 ? (
          <>
            <EmptyState
              icon={<FileText className="size-6" />}
              title="No active quotations"
              message={
                draftCount > 0
                  ? "Payments are recorded against active quotations. Activate a draft to bill it."
                  : "Payments are recorded against a quotation. Create one first, then come back."
              }
              action={
                draftCount > 0 ? (
                  <ButtonLink href="/quotations?status=DRAFT">View drafts</ButtonLink>
                ) : (
                  <ButtonLink href="/quotations/new">Create a quotation</ButtonLink>
                )
              }
            />
          </>
        ) : (
          <>
            <NewPaymentForm quotations={choices} defaultQuotationId={quotationId} />
            {draftNotice}
          </>
        )}
      </Card>
    </div>
  );
}
