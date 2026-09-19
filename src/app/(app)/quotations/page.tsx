import Link from "next/link";
import { format } from "date-fns";
import { QuotationStatus } from "@prisma/client";
import { FileText, Plus, SearchX, Send } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";
import {
  isBillableStatus,
  matchesPaymentFilter,
  matchesSearchQuery,
  parsePaymentFilter,
  quotationPaidBalance,
} from "@/lib/quotation-filters";
import { activateQuotationAction } from "@/lib/actions/quotations";
import {
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  ResponsiveRecords,
  StatusBadge,
  SubmitButton,
  TableHead,
  TableRow,
  Td,
  Th,
} from "@/components/ui";
import { QuotationFilters } from "@/components/quotation-filters";

function parseStatus(value?: string): QuotationStatus | undefined {
  if (!value || value === "all") return undefined;
  return (Object.values(QuotationStatus) as string[]).includes(value)
    ? (value as QuotationStatus)
    : undefined;
}

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; payment?: string; status?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || undefined;
  const payment = parsePaymentFilter(params.payment);
  const status = parseStatus(params.status);

  const quotations = await prisma.quotation.findMany({
    orderBy: { updatedAt: "desc" },
    include: { customer: true, event: true, payments: true },
  });

  const filtered = quotations.filter(
    (item) =>
      (!status || item.status === status) &&
      matchesSearchQuery(item, q) &&
      matchesPaymentFilter(payment, item),
  );

  // Drafts carry no balance, so they never contribute to the outstanding sum.
  const outstanding = filtered.reduce(
    (sum, item) =>
      isBillableStatus(item.status)
        ? sum + quotationPaidBalance(item.total, item.payments).balance
        : sum,
    0,
  );
  const draftCount = filtered.filter((item) => item.status === "DRAFT").length;

  return (
    <div>
      <PageHeader
        title="Quotations"
        description="Client-specific offers, independent of the catalogue"
        actions={
          <ButtonLink href="/quotations/new">
            <Plus className="size-4" />
            New quotation
          </ButtonLink>
        }
      />

      <QuotationFilters
        basePath="/quotations"
        q={q}
        payment={payment}
        status={status ?? "all"}
      />

      {quotations.length > 0 ? (
        <p className="mb-3 text-sm text-muted">
          Showing <span className="font-medium text-foreground">{filtered.length}</span>
          {filtered.length !== quotations.length ? ` of ${quotations.length}` : ""} quotation
          {filtered.length === 1 ? "" : "s"}
          {outstanding > 0 ? (
            <>
              {" · "}
              <span className="tabular text-warning">{formatINR(outstanding)}</span> outstanding
            </>
          ) : null}
          {draftCount > 0 ? (
            <>
              {" · "}
              {draftCount} draft{draftCount === 1 ? "" : "s"} not tracked
            </>
          ) : null}
        </p>
      ) : null}

      {quotations.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="size-6" />}
            title="No quotations yet"
            message="A quotation copies items from a catalogue and then lives on its own, so you can tailor it per client."
            action={<ButtonLink href="/quotations/new">Create your first quotation</ButtonLink>}
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<SearchX className="size-6" />}
            title="No matches"
            message="Nothing matches your search and filters. Try clearing them."
            action={
              <ButtonLink href="/quotations" variant="secondary">
                Clear filters
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <ResponsiveRecords
          cards={filtered.map((item) => {
            const { paid, balance } = quotationPaidBalance(item.total, item.payments);
            const isDraft = item.status === "DRAFT";
            return (
              <Card
                key={item.id}
                className="transition hover:border-border-strong hover:shadow-raised"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/quotations/${item.id}`}
                      className="font-medium text-foreground hover:text-accent"
                    >
                      {item.quotationNumber}
                    </Link>
                    <p className="mt-0.5 text-sm break-words text-muted">
                      {item.customer.name}
                      {item.event?.name ? ` · ${item.event.name}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-sm">
                  <div>
                    <p className="text-xs text-muted">Total</p>
                    <p className="tabular">{formatINR(item.total)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Paid</p>
                    <p className="tabular">{isDraft ? "—" : formatINR(paid)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Balance</p>
                    <p className="tabular">
                      {isDraft ? (
                        <span className="text-muted">Not tracked</span>
                      ) : balance > 0 ? (
                        <span className="text-warning">{formatINR(balance)}</span>
                      ) : (
                        <span className="text-success">Paid</span>
                      )}
                    </p>
                  </div>
                </div>
                {isDraft ? (
                  <form
                    action={activateQuotationAction}
                    className="mt-3 border-t border-border/60 pt-3"
                  >
                    <input type="hidden" name="id" value={item.id} />
                    <SubmitButton
                      variant="secondary"
                      size="sm"
                      pendingLabel="Activating…"
                      icon={<Send className="size-4" />}
                      className="w-full"
                    >
                      Activate
                    </SubmitButton>
                  </form>
                ) : null}
              </Card>
            );
          })}
          table={
            <table className="w-full text-left text-sm">
              <TableHead>
                <Th>Number</Th>
                <Th>Customer</Th>
                <Th>Event</Th>
                <Th align="right">Total</Th>
                <Th align="right">Paid</Th>
                <Th align="right">Balance</Th>
                <Th>Status</Th>
                <Th align="right">Updated</Th>
                <Th align="right">
                  <span className="sr-only">Actions</span>
                </Th>
              </TableHead>
              <tbody>
                {filtered.map((item) => {
                  const { paid, balance } = quotationPaidBalance(item.total, item.payments);
                  const isDraft = item.status === "DRAFT";
                  return (
                    <TableRow key={item.id}>
                      <Td>
                        <Link
                          href={`/quotations/${item.id}`}
                          className="font-medium hover:text-accent"
                        >
                          {item.quotationNumber}
                        </Link>
                      </Td>
                      <Td>{item.customer.name}</Td>
                      <Td className="text-muted">{item.event?.name || "—"}</Td>
                      <Td align="right" className="tabular">
                        {formatINR(item.total)}
                      </Td>
                      <Td align="right" className="tabular text-muted">
                        {isDraft ? "—" : formatINR(paid)}
                      </Td>
                      <Td align="right" className="tabular">
                        {isDraft ? (
                          <span className="text-muted">—</span>
                        ) : balance > 0 ? (
                          <span className="text-warning">{formatINR(balance)}</span>
                        ) : (
                          <span className="text-success">Paid</span>
                        )}
                      </Td>
                      <Td>
                        <StatusBadge status={item.status} />
                      </Td>
                      <Td align="right" className="text-xs whitespace-nowrap text-muted">
                        {format(item.updatedAt, "d MMM yyyy")}
                      </Td>
                      <Td align="right">
                        {isDraft ? (
                          <form action={activateQuotationAction}>
                            <input type="hidden" name="id" value={item.id} />
                            <SubmitButton
                              variant="ghost"
                              size="sm"
                              pendingLabel="Activating…"
                              icon={<Send className="size-4" />}
                            >
                              Activate
                            </SubmitButton>
                          </form>
                        ) : null}
                      </Td>
                    </TableRow>
                  );
                })}
              </tbody>
            </table>
          }
        />
      )}
    </div>
  );
}
