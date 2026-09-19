import Link from "next/link";
import { notFound } from "next/navigation";
import { format, isFuture } from "date-fns";
import {
  CalendarDays,
  FileText,
  FolderOpen,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  Plus,
  Receipt,
  Trash2,
  UserRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR, toNumber } from "@/lib/money";
import { isBillableStatus, quotationPaidBalance } from "@/lib/quotation-filters";
import {
  createEventAction,
  deleteCustomerAction,
  deleteEventAction,
  updateCustomerAction,
} from "@/lib/actions/customers";
import {
  Badge,
  ButtonLink,
  ConfirmSubmit,
  EmptyState,
  Field,
  FormActions,
  Metric,
  PageHeader,
  Panel,
  StatusBadge,
  SubmitButton,
  inputClass,
} from "@/components/ui";
import { PdfActions } from "@/components/pdf-actions";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      events: { orderBy: { eventDate: "desc" } },
      quotations: {
        orderBy: { createdAt: "desc" },
        include: {
          payments: { include: { receipt: true }, orderBy: { paymentDate: "desc" } },
        },
      },
    },
  });
  if (!customer) notFound();

  const allPayments = customer.quotations.flatMap((quotation) =>
    quotation.payments.map((payment) => ({
      ...payment,
      quotationNumber: quotation.quotationNumber,
      quotationId: quotation.id,
    })),
  );

  const quoted = customer.quotations.reduce(
    (sum, quotation) => sum + toNumber(quotation.total),
    0,
  );
  const received = allPayments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);

  // Only active quotations are owed — drafts and rejected offers don't count.
  const outstanding = customer.quotations.reduce(
    (sum, quotation) =>
      isBillableStatus(quotation.status)
        ? sum + quotationPaidBalance(quotation.total, quotation.payments).balance
        : sum,
    0,
  );
  const draftCount = customer.quotations.filter(
    (quotation) => quotation.status === "DRAFT",
  ).length;

  const contactLines = [
    customer.phone ? { icon: <Phone className="size-3.5" />, text: customer.phone } : null,
    customer.email ? { icon: <Mail className="size-3.5" />, text: customer.email } : null,
    customer.address ? { icon: <MapPin className="size-3.5" />, text: customer.address } : null,
  ].filter(Boolean) as { icon: React.ReactNode; text: string }[];

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: "Customers", href: "/customers" },
          { label: customer.name },
        ]}
        title={customer.name}
        description={
          contactLines.length > 0 ? (
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {contactLines.map((line, index) => (
                <span key={index} className="inline-flex items-center gap-1.5">
                  {line.icon}
                  {line.text}
                </span>
              ))}
            </span>
          ) : (
            "No contact details yet"
          )
        }
        actions={
          <>
            <ButtonLink href={`/quotations/new?customerId=${customer.id}`}>
              <Plus className="size-4" />
              Quotation
            </ButtonLink>
            <form action={deleteCustomerAction}>
              <input type="hidden" name="id" value={customer.id} />
              <ConfirmSubmit
                variant="danger-ghost"
                size="icon"
                title={`Delete ${customer.name}?`}
                description="Their events, quotations, payments and receipts will all be permanently removed."
                confirmLabel="Delete customer"
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Delete customer</span>
              </ConfirmSubmit>
            </form>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Quoted" value={formatINR(quoted)} />
        <Metric label="Received" value={formatINR(received)} tone="success" />
        <Metric
          label="Outstanding"
          value={formatINR(outstanding)}
          tone={outstanding > 0 ? "warning" : "success"}
          hint={draftCount > 0 ? `${draftCount} draft excluded` : undefined}
        />
        <Metric
          label="Quotations"
          value={String(customer.quotations.length)}
          hint={`${customer.events.length} event${customer.events.length === 1 ? "" : "s"}`}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Profile" icon={<UserRound className="size-4" />}>
          <form action={updateCustomerAction} className="space-y-5">
            <input type="hidden" name="id" value={customer.id} />
            <Field label="Name" required>
              <input name="name" required defaultValue={customer.name} className={inputClass} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Phone">
                <input
                  name="phone"
                  type="tel"
                  defaultValue={customer.phone ?? ""}
                  className={inputClass}
                />
              </Field>
              <Field label="WhatsApp">
                <input
                  name="whatsapp"
                  type="tel"
                  defaultValue={customer.whatsapp ?? ""}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Email">
              <input
                name="email"
                type="email"
                defaultValue={customer.email ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Address">
              <textarea
                name="address"
                rows={2}
                defaultValue={customer.address ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Notes">
              <textarea
                name="notes"
                rows={3}
                defaultValue={customer.notes ?? ""}
                className={inputClass}
              />
            </Field>
            <FormActions>
              <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
            </FormActions>
          </form>
        </Panel>

        <Panel
          title="Events"
          description="Shoots and ceremonies for this client"
          icon={<CalendarDays className="size-4" />}
        >
          {customer.events.length === 0 ? (
            <p className="rounded-lg bg-surface-sunken/60 px-3.5 py-3 text-sm text-muted">
              No events yet. Add one below so quotations can reference it.
            </p>
          ) : (
            <ul className="mb-5 divide-y divide-border/60">
              {customer.events.map((event) => (
                <li key={event.id} className="flex items-start gap-3 py-3 first:pt-0">
                  <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-accent-soft text-accent-dark">
                    <span className="text-sm leading-none font-semibold">
                      {event.eventDate ? format(event.eventDate, "d") : "–"}
                    </span>
                    <span className="text-[0.625rem] leading-none uppercase">
                      {event.eventDate ? format(event.eventDate, "MMM") : ""}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium break-words text-foreground">
                      {event.name}
                      {event.eventDate && isFuture(event.eventDate) ? (
                        <Badge tone="accent">Upcoming</Badge>
                      ) : null}
                    </p>
                    <p className="text-sm break-words text-muted">
                      {[
                        event.type,
                        event.eventDate ? format(event.eventDate, "d MMM yyyy") : null,
                        event.location,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "No details"}
                    </p>
                  </div>
                  <form action={deleteEventAction}>
                    <input type="hidden" name="id" value={event.id} />
                    <input type="hidden" name="customerId" value={customer.id} />
                    <ConfirmSubmit
                      variant="danger-ghost"
                      size="sm"
                      title={`Remove ${event.name}?`}
                      description="Quotations linked to this event will keep their items but lose the event reference."
                      confirmLabel="Remove event"
                    >
                      Remove
                    </ConfirmSubmit>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <form
            action={createEventAction}
            className="space-y-4 border-t border-border/70 pt-5"
          >
            <input type="hidden" name="customerId" value={customer.id} />
            <Field label="Event name" required>
              <input
                name="name"
                required
                placeholder="Wedding ceremony"
                className={inputClass}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type">
                <input name="type" placeholder="Wedding" className={inputClass} />
              </Field>
              <Field label="Date">
                <input name="eventDate" type="date" className={inputClass} />
              </Field>
            </div>
            <Field label="Location">
              <input name="location" placeholder="Venue or city" className={inputClass} />
            </Field>
            <Field label="Notes">
              <textarea name="notes" rows={2} className={inputClass} />
            </Field>
            <SubmitButton variant="secondary" pendingLabel="Adding…" icon={<Plus className="size-4" />}>
              Add event
            </SubmitButton>
          </form>
        </Panel>
      </div>

      <Panel
        title="Quotations"
        description={`${customer.quotations.length} total`}
        icon={<FileText className="size-4" />}
        bodyClassName={customer.quotations.length > 0 ? "p-0 sm:p-0" : undefined}
        actions={
          <ButtonLink
            href={`/quotations/new?customerId=${customer.id}`}
            variant="secondary"
            size="sm"
          >
            <Plus className="size-4" />
            New
          </ButtonLink>
        }
      >
        {customer.quotations.length === 0 ? (
          <EmptyState
            icon={<FileText className="size-5" />}
            message="No quotations for this client yet."
            action={
              <ButtonLink href={`/quotations/new?customerId=${customer.id}`}>
                Create quotation
              </ButtonLink>
            }
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {customer.quotations.map((quotation) => {
              const paid = quotation.payments.reduce(
                (sum, payment) => sum + toNumber(payment.amount),
                0,
              );
              const balance = Math.max(0, toNumber(quotation.total) - paid);
              return (
                <li
                  key={quotation.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/quotations/${quotation.id}`}
                      className="font-medium text-foreground hover:text-accent"
                    >
                      {quotation.quotationNumber}
                    </Link>
                    <p className="tabular text-xs text-muted">
                      {formatINR(quotation.total)} · {formatINR(paid)} paid
                      {balance > 0 ? ` · ${formatINR(balance)} due` : ""}
                    </p>
                  </div>
                  <StatusBadge status={quotation.status} />
                  <PdfActions
                    type="quotation"
                    id={quotation.id}
                    variant="compact"
                    previewLabel="Preview"
                    downloadLabel="PDF"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel
        title="Payments & receipts"
        description={
          allPayments.length > 0
            ? `${formatINR(received)} received across ${allPayments.length} payment${allPayments.length === 1 ? "" : "s"}`
            : "Nothing recorded yet"
        }
        icon={<IndianRupee className="size-4" />}
        bodyClassName={allPayments.length > 0 ? "p-0 sm:p-0" : undefined}
      >
        {allPayments.length === 0 ? (
          <EmptyState
            icon={<Receipt className="size-5" />}
            message="No payments recorded for this client."
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {allPayments.map((payment) => (
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
                    {payment.paymentMethod.replace("_", " ").toLowerCase()} ·{" "}
                    <Link
                      href={`/quotations/${payment.quotationId}`}
                      className="hover:text-accent hover:underline"
                    >
                      {payment.quotationNumber}
                    </Link>
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

      {customer.notes ? (
        <Panel title="Notes" icon={<FolderOpen className="size-4" />}>
          <p className="text-sm whitespace-pre-line text-muted">{customer.notes}</p>
        </Panel>
      ) : null}
    </div>
  );
}
