import { format } from "date-fns";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/money";
import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import {
  NewQuotationForm,
  type CustomerChoice,
  type PackageChoice,
} from "@/components/new-quotation-form";

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  const [customers, packages] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      include: { events: { orderBy: { eventDate: "desc" } } },
    }),
    prisma.package.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      include: { _count: { select: { items: true } } },
    }),
  ]);

  const customerChoices: CustomerChoice[] = customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    events: customer.events.map((event) => ({
      id: event.id,
      label: event.name,
      hint: [event.type, event.eventDate ? format(event.eventDate, "d MMM yyyy") : null]
        .filter(Boolean)
        .join(" · "),
    })),
  }));

  const packageChoices: PackageChoice[] = packages.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    basePrice: toNumber(pkg.basePrice),
    itemCount: pkg._count.items,
  }));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        breadcrumbs={[{ label: "Quotations", href: "/quotations" }, { label: "New" }]}
        title="Create quotation"
        description="Pick the client and an optional starting package — you can edit every line afterwards."
      />
      <Card>
        {customers.length === 0 ? (
          <EmptyState
            icon={<Users className="size-6" />}
            title="Add a customer first"
            message="Quotations are always tied to a client, so start by creating a customer profile."
            action={<ButtonLink href="/customers/new">Add a customer</ButtonLink>}
          />
        ) : (
          <NewQuotationForm
            customers={customerChoices}
            packages={packageChoices}
            defaultCustomerId={customerId}
          />
        )}
      </Card>
    </div>
  );
}
