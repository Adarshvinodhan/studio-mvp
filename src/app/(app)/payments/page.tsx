import Link from "next/link";
import { format, isSameMonth } from "date-fns";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR, toNumber } from "@/lib/money";
import { deletePaymentAction } from "@/lib/actions/payments";
import {
  ButtonLink,
  Card,
  ConfirmSubmit,
  EmptyState,
  Metric,
  PageHeader,
  ResponsiveRecords,
  TableHead,
  TableRow,
  Td,
  Th,
} from "@/components/ui";
import { PdfActions } from "@/components/pdf-actions";
import { cn } from "@/lib/cn";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>;
}) {
  const { highlight } = await searchParams;
  const payments = await prisma.payment.findMany({
    orderBy: { paymentDate: "desc" },
    include: {
      receipt: true,
      quotation: { include: { customer: true } },
    },
  });

  const now = new Date();
  const total = payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const thisMonth = payments
    .filter((payment) => isSameMonth(payment.paymentDate, now))
    .reduce((sum, payment) => sum + toNumber(payment.amount), 0);

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Every payment is a separate transaction against a quotation"
        actions={
          <ButtonLink href="/payments/new">
            <Plus className="size-4" />
            Record payment
          </ButtonLink>
        }
      />

      {payments.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CreditCard className="size-6" />}
            title="No payments yet"
            message="Recording a payment automatically generates a numbered receipt PDF you can send to the client."
            action={<ButtonLink href="/payments/new">Record your first payment</ButtonLink>}
          />
        </Card>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric label="Total received" value={formatINR(total)} tone="success" />
            <Metric label="This month" value={formatINR(thisMonth)} tone="accent" />
            <Metric
              label="Transactions"
              value={String(payments.length)}
              hint={`${payments.filter((p) => p.receipt).length} receipts issued`}
            />
          </div>

          <ResponsiveRecords
            cards={payments.map((payment) => (
              <Card
                key={payment.id}
                className={cn(
                  highlight === payment.id && "border-accent/50 bg-accent-soft/40",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/customers/${payment.quotation.customerId}`}
                      className="font-medium break-words text-foreground hover:text-accent"
                    >
                      {payment.quotation.customer.name}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted">
                      {format(payment.paymentDate, "d MMM yyyy")} ·{" "}
                      {payment.paymentMethod.replace("_", " ").toLowerCase()}
                    </p>
                  </div>
                  <p className="tabular shrink-0 font-semibold text-foreground">
                    {formatINR(payment.amount)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 text-sm">
                  <Link
                    href={`/quotations/${payment.quotationId}`}
                    className="text-muted hover:text-accent"
                  >
                    {payment.quotation.quotationNumber}
                  </Link>
                  {payment.receipt ? (
                    <PdfActions
                      type="receipt"
                      id={payment.id}
                      variant="links"
                      previewLabel="Preview"
                      downloadLabel={payment.receipt.receiptNumber}
                    />
                  ) : null}
                  <form action={deletePaymentAction} className="ml-auto">
                    <input type="hidden" name="id" value={payment.id} />
                    <DeletePaymentButton
                      amount={formatINR(payment.amount)}
                      quotationNumber={payment.quotation.quotationNumber}
                    />
                  </form>
                </div>
              </Card>
            ))}
            table={
              <table className="w-full text-left text-sm">
                <TableHead>
                  <Th>Date</Th>
                  <Th>Customer</Th>
                  <Th>Quotation</Th>
                  <Th align="right">Amount</Th>
                  <Th>Method</Th>
                  <Th>Receipt</Th>
                  <Th />
                </TableHead>
                <tbody>
                  {payments.map((payment) => (
                    <TableRow
                      key={payment.id}
                      className={cn(highlight === payment.id && "bg-accent-soft/50")}
                    >
                      <Td className="whitespace-nowrap">
                        {format(payment.paymentDate, "d MMM yyyy")}
                      </Td>
                      <Td>
                        <Link
                          href={`/customers/${payment.quotation.customerId}`}
                          className="font-medium hover:text-accent"
                        >
                          {payment.quotation.customer.name}
                        </Link>
                      </Td>
                      <Td>
                        <Link
                          href={`/quotations/${payment.quotationId}`}
                          className="text-muted hover:text-accent"
                        >
                          {payment.quotation.quotationNumber}
                        </Link>
                      </Td>
                      <Td align="right" className="tabular font-medium">
                        {formatINR(payment.amount)}
                      </Td>
                      <Td className="text-muted capitalize">
                        {payment.paymentMethod.replace("_", " ").toLowerCase()}
                      </Td>
                      <Td>
                        {payment.receipt ? (
                          <PdfActions
                            type="receipt"
                            id={payment.id}
                            variant="links"
                            previewLabel="Preview"
                            downloadLabel={payment.receipt.receiptNumber}
                          />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </Td>
                      <Td align="right">
                        <form action={deletePaymentAction}>
                          <input type="hidden" name="id" value={payment.id} />
                          <DeletePaymentButton
                            amount={formatINR(payment.amount)}
                            quotationNumber={payment.quotation.quotationNumber}
                          />
                        </form>
                      </Td>
                    </TableRow>
                  ))}
                </tbody>
              </table>
            }
          />
        </>
      )}
    </div>
  );
}

function DeletePaymentButton({
  amount,
  quotationNumber,
}: {
  amount: string;
  quotationNumber: string;
}) {
  return (
    <ConfirmSubmit
      variant="danger-ghost"
      size="sm"
      title={`Delete this ${amount} payment?`}
      description={`The receipt is deleted too and ${quotationNumber} will show a larger outstanding balance.`}
      confirmLabel="Delete payment"
    >
      <Trash2 className="size-3.5" />
      <span className="sr-only sm:not-sr-only">Delete</span>
    </ConfirmSubmit>
  );
}
