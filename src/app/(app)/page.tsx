import Link from "next/link";
import { format, isSameMonth, startOfMonth, subMonths } from "date-fns";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CreditCard,
  FileText,
  IndianRupee,
  PencilLine,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR, toNumber } from "@/lib/money";
import { isBillableStatus, quotationPaidBalance } from "@/lib/quotation-filters";
import {
  ButtonLink,
  Card,
  EmptyState,
  Metric,
  PageHeader,
  Panel,
  SectionHeading,
  StatusBadge,
} from "@/components/ui";
import { RevenueChart, type RevenuePoint } from "@/components/revenue-chart";

const MONTHS_SHOWN = 6;

export default async function DashboardPage() {
  const now = new Date();

  const [customerCount, packageCount, payments, quotations, upcomingEvents] =
    await Promise.all([
      prisma.customer.count(),
      prisma.package.count({ where: { status: "ACTIVE" } }),
      prisma.payment.findMany({ select: { amount: true, paymentDate: true } }),
      prisma.quotation.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          customer: { select: { id: true, name: true } },
          event: { select: { name: true, eventDate: true } },
          payments: { select: { amount: true } },
        },
      }),
      prisma.event.findMany({
        where: { eventDate: { gte: now } },
        orderBy: { eventDate: "asc" },
        take: 5,
        include: { customer: { select: { id: true, name: true } } },
      }),
    ]);

  const received = payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const receivedThisMonth = payments
    .filter((payment) => isSameMonth(payment.paymentDate, now))
    .reduce((sum, payment) => sum + toNumber(payment.amount), 0);

  // Drafts and rejected offers are excluded from every money figure below —
  // nothing is owed until a quotation has actually been sent to the client.
  const billable = quotations
    .filter((quotation) => isBillableStatus(quotation.status))
    .map((quotation) => ({
      quotation,
      ...quotationPaidBalance(quotation.total, quotation.payments),
    }));

  const pending = billable.reduce((sum, row) => sum + row.balance, 0);
  const drafts = quotations.filter((quotation) => quotation.status === "DRAFT");
  const awaitingReply = quotations.filter((quotation) => quotation.status === "SENT").length;

  // Oldest-touched unpaid quotations first — these are the ones to chase.
  const followUps = billable
    .filter((row) => row.balance > 0)
    .sort((a, b) => a.quotation.updatedAt.getTime() - b.quotation.updatedAt.getTime())
    .slice(0, 5);

  const chartData: RevenuePoint[] = Array.from({ length: MONTHS_SHOWN }, (_, index) => {
    const month = startOfMonth(subMonths(now, MONTHS_SHOWN - 1 - index));
    const value = payments
      .filter((payment) => isSameMonth(payment.paymentDate, month))
      .reduce((sum, payment) => sum + toNumber(payment.amount), 0);
    return { label: format(month, "MMM"), value };
  });

  const recent = quotations.slice(0, 6);
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const isEmptyStudio = quotations.length === 0 && customerCount === 0;

  return (
    <div>
      <PageHeader
        title={greeting}
        description={`${format(now, "EEEE, d MMMM yyyy")} · your studio at a glance`}
        actions={
          <>
            <ButtonLink href="/quotations/new">
              <Plus className="size-4" />
              Quotation
            </ButtonLink>
            <ButtonLink href="/payments/new" variant="secondary">
              <Plus className="size-4" />
              Payment
            </ButtonLink>
          </>
        }
      />

      {isEmptyStudio ? (
        <Card className="mb-6">
          <EmptyState
            icon={<Users className="size-6" />}
            title="Let's set up your studio"
            message="Start by adding a customer, then build a catalogue you can reuse across quotations."
            action={
              <>
                <ButtonLink href="/customers/new">Add first customer</ButtonLink>
                <ButtonLink href="/catalogues/new" variant="secondary">
                  Create a catalogue
                </ButtonLink>
              </>
            }
          />
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric
          label="Pending balance"
          value={formatINR(pending)}
          tone={pending > 0 ? "warning" : "success"}
          icon={<IndianRupee className="size-4" />}
          hint={pending > 0 ? `${followUps.length} to follow up` : "Nothing outstanding"}
        />
        <Metric
          label="Received"
          value={formatINR(received)}
          tone="success"
          icon={<TrendingUp className="size-4" />}
          hint={`${formatINR(receivedThisMonth)} this month`}
        />
        <Metric
          label="Awaiting reply"
          value={String(awaitingReply)}
          icon={<FileText className="size-4" />}
          hint={`${drafts.length} draft${drafts.length === 1 ? "" : "s"} · ${quotations.length} total`}
        />
        <Metric
          label="Customers"
          value={String(customerCount)}
          icon={<Users className="size-4" />}
          hint={`${packageCount} active catalogue${packageCount === 1 ? "" : "s"}`}
        />
      </div>

      {drafts.length > 0 ? (
        <Link
          href="/quotations?status=DRAFT"
          className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface/70 px-4 py-3 transition hover:border-accent/40 hover:bg-accent-soft/40"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-muted">
            <PencilLine className="size-4" />
          </span>
          <span className="min-w-0 flex-1 text-sm">
            <span className="block font-medium text-foreground">
              {drafts.length} draft quotation{drafts.length === 1 ? "" : "s"} not yet active
            </span>
            <span className="block text-xs text-muted">
              Drafts are left out of balances and follow-ups. Activate one to start tracking
              it.
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-muted" />
        </Link>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Panel
          title="Payments received"
          description={`Last ${MONTHS_SHOWN} months`}
          icon={<CreditCard className="size-4" />}
          className="lg:col-span-3"
          actions={
            <Link
              href="/payments"
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              All payments
              <ArrowRight className="size-3.5" />
            </Link>
          }
        >
          <RevenueChart data={chartData} />
        </Panel>

        <Panel
          title="Needs follow-up"
          description="Oldest outstanding balances — drafts excluded"
          icon={<IndianRupee className="size-4" />}
          className="lg:col-span-2"
          bodyClassName="p-0 sm:p-0"
        >
          {followUps.length === 0 ? (
            <EmptyState
              message="Nothing outstanding. Every sent quotation is fully paid."
              icon={<TrendingUp className="size-5" />}
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {followUps.map(({ quotation, balance }) => (
                <li key={quotation.id}>
                  <Link
                    href={`/quotations/${quotation.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-accent-soft/30 sm:px-5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {quotation.customer.name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {quotation.quotationNumber} · updated{" "}
                        {format(quotation.updatedAt, "d MMM")}
                      </span>
                    </span>
                    <span className="tabular shrink-0 text-sm font-semibold text-warning">
                      {formatINR(balance)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {followUps.length > 0 ? (
            <div className="border-t border-border/60 px-4 py-2.5 sm:px-5">
              <Link
                href="/quotations?payment=pending"
                className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
              >
                See all pending
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ) : null}
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Panel
          title="Upcoming events"
          description="Next shoots on the calendar"
          icon={<CalendarDays className="size-4" />}
          className="lg:col-span-2"
          bodyClassName="p-0 sm:p-0"
        >
          {upcomingEvents.length === 0 ? (
            <EmptyState
              message="No future events scheduled. Add one from a customer's profile."
              icon={<CalendarDays className="size-5" />}
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {upcomingEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/customers/${event.customerId}`}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-accent-soft/30 sm:px-5"
                  >
                    <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-accent-soft text-accent-dark">
                      <span className="text-sm leading-none font-semibold">
                        {event.eventDate ? format(event.eventDate, "d") : "–"}
                      </span>
                      <span className="text-[0.625rem] leading-none uppercase">
                        {event.eventDate ? format(event.eventDate, "MMM") : ""}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {event.name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {event.customer.name}
                        {event.location ? ` · ${event.location}` : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Quick actions"
          description="Common studio tasks"
          icon={<BookOpen className="size-4" />}
          className="lg:col-span-3"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <QuickAction
              href="/customers/new"
              title="Add customer"
              hint="Create a client profile"
              icon={<Users className="size-4" />}
            />
            <QuickAction
              href="/quotations/new"
              title="New quotation"
              hint="Build an offer from a catalogue"
              icon={<FileText className="size-4" />}
            />
            <QuickAction
              href="/payments/new"
              title="Record payment"
              hint="Log money and issue a receipt"
              icon={<CreditCard className="size-4" />}
            />
            <QuickAction
              href="/catalogues/new"
              title="New catalogue"
              hint="Package you can reuse"
              icon={<BookOpen className="size-4" />}
            />
          </div>
        </Panel>
      </div>

      <section className="mt-8">
        <SectionHeading
          title="Recent quotations"
          action={
            <Link
              href="/quotations"
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              View all
              <ArrowRight className="size-3.5" />
            </Link>
          }
        />

        {recent.length === 0 ? (
          <Card>
            <EmptyState
              icon={<FileText className="size-5" />}
              message="No quotations yet. Create one to send your first offer."
              action={<ButtonLink href="/quotations/new">New quotation</ButtonLink>}
            />
          </Card>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {recent.map((quotation) => {
              const { balance } = quotationPaidBalance(quotation.total, quotation.payments);
              const tracked = isBillableStatus(quotation.status);
              return (
                <li key={quotation.id}>
                  <Link href={`/quotations/${quotation.id}`} className="block">
                    <Card className="transition hover:border-border-strong hover:shadow-raised">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {quotation.customer.name}
                          </p>
                          <p className="mt-0.5 truncate text-sm text-muted">
                            {quotation.quotationNumber}
                            {quotation.event?.name ? ` · ${quotation.event.name}` : ""}
                          </p>
                        </div>
                        <StatusBadge status={quotation.status} />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3 text-sm">
                        <span className="tabular font-medium">{formatINR(quotation.total)}</span>
                        {!tracked ? (
                          <span className="text-muted">Not tracked</span>
                        ) : balance > 0 ? (
                          <span className="tabular text-warning">
                            {formatINR(balance)} pending
                          </span>
                        ) : (
                          <span className="text-success">Fully paid</span>
                        )}
                      </div>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function QuickAction({
  href,
  title,
  hint,
  icon,
}: {
  href: string;
  title: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border bg-surface/70 px-3.5 py-3 transition hover:border-accent/40 hover:bg-accent-soft/40"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-dark">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{title}</span>
        <span className="block truncate text-xs text-muted">{hint}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" />
    </Link>
  );
}
