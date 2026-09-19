import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  ListOrdered,
  PencilLine,
  Plus,
  Receipt,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR, toNumber } from "@/lib/money";
import {
  activateQuotationAction,
  deleteQuotationAction,
  saveQuotationItemsAction,
  updateQuotationMetaAction,
} from "@/lib/actions/quotations";
import {
  ButtonLink,
  ConfirmSubmit,
  EmptyState,
  Field,
  FormActions,
  Metric,
  PageHeader,
  Panel,
  SubmitButton,
  inputClass,
} from "@/components/ui";
import { PdfActions } from "@/components/pdf-actions";
import { ItemsEditor } from "@/components/items-editor";
import { QuotationStatusSelect } from "@/components/quotation-status-select";

export default async function QuotationEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      event: true,
      items: { orderBy: { sortOrder: "asc" } },
      payments: { include: { receipt: true }, orderBy: { paymentDate: "desc" } },
    },
  });
  if (!quotation) notFound();

  const events = await prisma.event.findMany({
    where: { customerId: quotation.customerId },
    orderBy: { eventDate: "desc" },
  });

  const total = toNumber(quotation.total);
  const paid = quotation.payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const balance = Math.max(0, total - paid);
  const paidRatio = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const isDraft = quotation.status === "DRAFT";

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: "Quotations", href: "/quotations" },
          { label: quotation.quotationNumber },
        ]}
        title={quotation.quotationNumber}
        badge={<QuotationStatusSelect id={quotation.id} status={quotation.status} />}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link
              href={`/customers/${quotation.customerId}`}
              className="inline-flex items-center gap-1.5 hover:text-accent-dark hover:underline"
            >
              <UserRound className="size-3.5" />
              {quotation.customer.name}
            </Link>
            {quotation.event ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {quotation.event.name}
                {quotation.event.eventDate
                  ? ` · ${format(quotation.event.eventDate, "d MMM yyyy")}`
                  : ""}
              </span>
            ) : null}
          </span>
        }
        actions={
          <>
            <PdfActions
              type="quotation"
              id={quotation.id}
              itemCount={quotation.items.length}
            />
            {isDraft ? null : (
              <ButtonLink
                href={`/payments/new?quotationId=${quotation.id}`}
                variant="secondary"
              >
                <Plus className="size-4" />
                Payment
              </ButtonLink>
            )}
            <form action={deleteQuotationAction}>
              <input type="hidden" name="id" value={quotation.id} />
              <ConfirmSubmit
                variant="danger-ghost"
                size="icon"
                title={`Delete ${quotation.quotationNumber}?`}
                description="The quotation, its line items and all linked payments and receipts will be permanently removed."
                confirmLabel="Delete quotation"
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Delete quotation</span>
              </ConfirmSubmit>
            </form>
          </>
        }
      />

      {isDraft ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/70 p-4 sm:flex-row sm:items-center">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-muted">
            <PencilLine className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">This quotation is a draft</p>
            <p className="mt-0.5 text-xs text-muted">
              Drafts are left out of outstanding balances, follow-ups and the payment
              picker. Activate it once you&apos;ve shared it with{" "}
              {quotation.customer.name}.
            </p>
          </div>
          <form action={activateQuotationAction} className="shrink-0">
            <input type="hidden" name="id" value={quotation.id} />
            <SubmitButton
              pendingLabel="Activating…"
              icon={<Send className="size-4" />}
              className="w-full sm:w-auto"
            >
              Activate quotation
            </SubmitButton>
          </form>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Total" value={formatINR(total)} />
        <Metric label="Paid" value={formatINR(paid)} tone="success" />
        <Metric
          label="Balance"
          value={formatINR(balance)}
          tone={balance > 0 ? "warning" : "success"}
        />
        <Metric
          label="Collected"
          value={`${paidRatio}%`}
          tone="accent"
          hint={
            <span
              className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-border-strong/40"
              role="presentation"
            >
              <span
                className="block h-full rounded-full bg-accent"
                style={{ width: `${paidRatio}%` }}
              />
            </span>
          }
        />
      </div>

      <Panel
        title="Line items"
        description="Edit freely — totals update live, then save once."
        icon={<ListOrdered className="size-4" />}
      >
        <ItemsEditor
          items={quotation.items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            category: item.category,
            quantity: toNumber(item.quantity),
            unitPrice: toNumber(item.unitPrice),
          }))}
          discount={toNumber(quotation.discount)}
          tax={toNumber(quotation.tax)}
          save={saveQuotationItemsAction.bind(null, quotation.id)}
          savedTitle="Quotation saved"
        />
      </Panel>

      <Panel
        title="Details & terms"
        description="Appears on the generated PDF"
        icon={<FileText className="size-4" />}
      >
        <form action={updateQuotationMetaAction} className="space-y-5">
          <input type="hidden" name="id" value={quotation.id} />
          <input type="hidden" name="status" value={quotation.status} />

          <Field label="Linked event" hint="Create events on the customer's profile">
            <select
              name="eventId"
              defaultValue={quotation.eventId ?? ""}
              className={inputClass}
            >
              <option value="">No specific event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                  {event.eventDate ? ` — ${format(event.eventDate, "d MMM yyyy")}` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Internal notes" hint="Shown on the quotation PDF">
            <textarea
              name="notes"
              rows={3}
              defaultValue={quotation.notes ?? ""}
              className={inputClass}
              placeholder="Anything the client should know"
            />
          </Field>

          <Field label="Terms & conditions">
            <textarea
              name="terms"
              rows={10}
              defaultValue={quotation.terms ?? ""}
              className={inputClass}
            />
          </Field>

          <FormActions>
            <SubmitButton pendingLabel="Saving…">Save details</SubmitButton>
            <p className="text-xs text-muted">
              Line items and money are saved separately, above.
            </p>
          </FormActions>
        </form>
      </Panel>

      <Panel
        title="Payment history"
        description={
          quotation.payments.length > 0
            ? `${quotation.payments.length} payment${quotation.payments.length === 1 ? "" : "s"} · ${formatINR(paid)} received`
            : "No payments recorded yet"
        }
        icon={<Receipt className="size-4" />}
        bodyClassName={quotation.payments.length > 0 ? "p-0 sm:p-0" : undefined}
        actions={
          balance > 0 && !isDraft ? (
            <ButtonLink
              href={`/payments/new?quotationId=${quotation.id}`}
              variant="secondary"
              size="sm"
            >
              <Plus className="size-4" />
              Record payment
            </ButtonLink>
          ) : null
        }
      >
        {quotation.payments.length === 0 ? (
          <EmptyState
            icon={<Receipt className="size-5" />}
            message={
              isDraft
                ? "Payments can't be recorded against a draft. Activate the quotation first."
                : `No payments yet. ${formatINR(balance)} is outstanding.`
            }
            action={
              isDraft ? null : (
                <ButtonLink href={`/payments/new?quotationId=${quotation.id}`}>
                  Record first payment
                </ButtonLink>
              )
            }
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {quotation.payments.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="tabular text-sm font-medium text-foreground">
                    {formatINR(payment.amount)}
                  </p>
                  <p className="text-xs text-muted">
                    {format(payment.paymentDate, "d MMM yyyy")} ·{" "}
                    {payment.paymentMethod.replace("_", " ").toLowerCase()}
                    {payment.referenceNumber ? ` · ref ${payment.referenceNumber}` : ""}
                  </p>
                </div>
                {payment.receipt ? (
                  <PdfActions
                    type="receipt"
                    id={payment.id}
                    variant="compact"
                    previewLabel="Preview"
                    downloadLabel={payment.receipt.receiptNumber}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <p className="pb-2 text-center text-xs text-muted">
        <Link
          href={`/customers/${quotation.customerId}`}
          className="inline-flex items-center gap-1 hover:text-accent-dark hover:underline"
        >
          View {quotation.customer.name}&apos;s full history
          <ExternalLink className="size-3" />
        </Link>
      </p>
    </div>
  );
}
