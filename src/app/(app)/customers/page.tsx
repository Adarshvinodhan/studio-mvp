import Link from "next/link";
import { CalendarDays, FileText, Phone, Plus, SearchX, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  ResponsiveRecords,
  TableHead,
  TableRow,
  Td,
  Th,
} from "@/components/ui";
import { SearchInput } from "@/components/search-input";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = q?.trim() || undefined;

  const customers = await prisma.customer.findMany({
    where: term
      ? {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { phone: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { events: true, quotations: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Client profiles, events and their full quotation history"
        actions={
          <ButtonLink href="/customers/new">
            <Plus className="size-4" />
            New customer
          </ButtonLink>
        }
      />

      <SearchInput
        basePath="/customers"
        value={term}
        placeholder="Search by name, phone or email…"
        className="mb-4 w-full sm:max-w-md"
      />

      {customers.length === 0 ? (
        <Card>
          {term ? (
            <EmptyState
              icon={<SearchX className="size-6" />}
              title="No matches"
              message={`Nothing found for “${term}”.`}
              action={
                <>
                  <ButtonLink href="/customers" variant="secondary">
                    Clear search
                  </ButtonLink>
                  <ButtonLink href="/customers/new">Add customer</ButtonLink>
                </>
              }
            />
          ) : (
            <EmptyState
              icon={<Users className="size-6" />}
              title="No customers yet"
              message="Add your first client to start building quotations and tracking payments."
              action={<ButtonLink href="/customers/new">Add your first customer</ButtonLink>}
            />
          )}
        </Card>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">
            {customers.length} customer{customers.length === 1 ? "" : "s"}
          </p>
          <ResponsiveRecords
            cards={customers.map((customer) => (
              <Link key={customer.id} href={`/customers/${customer.id}`} className="block">
                <Card className="transition hover:border-border-strong hover:shadow-raised">
                  <p className="font-medium break-words text-foreground">{customer.name}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                    <Phone className="size-3.5 shrink-0" />
                    {customer.phone || "No phone on file"}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border/60 pt-3 text-xs text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      {customer._count.events} event
                      {customer._count.events === 1 ? "" : "s"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="size-3.5" />
                      {customer._count.quotations} quotation
                      {customer._count.quotations === 1 ? "" : "s"}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
            table={
              <table className="w-full text-left text-sm">
                <TableHead>
                  <Th>Name</Th>
                  <Th>Phone</Th>
                  <Th>Email</Th>
                  <Th align="right">Events</Th>
                  <Th align="right">Quotations</Th>
                </TableHead>
                <tbody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <Td>
                        <Link
                          href={`/customers/${customer.id}`}
                          className="font-medium hover:text-accent"
                        >
                          {customer.name}
                        </Link>
                      </Td>
                      <Td className="text-muted">{customer.phone || "—"}</Td>
                      <Td className="text-muted">{customer.email || "—"}</Td>
                      <Td align="right" className="tabular">
                        {customer._count.events}
                      </Td>
                      <Td align="right" className="tabular">
                        {customer._count.quotations}
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
