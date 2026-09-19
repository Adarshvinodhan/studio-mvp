import Link from "next/link";
import { BookOpen, Copy, FileText, Layers, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";
import { duplicatePackageAction } from "@/lib/actions/packages";
import {
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
  SubmitButton,
} from "@/components/ui";
import { PdfActions } from "@/components/pdf-actions";

export default async function CataloguesPage() {
  const packages = await prisma.package.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: { _count: { select: { items: true } } },
  });

  const active = packages.filter((pkg) => pkg.status === "ACTIVE").length;

  return (
    <div>
      <PageHeader
        title="Catalogues"
        description="Reusable packages you can drop into any quotation"
        actions={
          <ButtonLink href="/catalogues/new">
            <Plus className="size-4" />
            New catalogue
          </ButtonLink>
        }
      />

      {packages.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen className="size-6" />}
            title="No catalogues yet"
            message="Build a package once — its items get copied into every quotation you create from it, so you never retype a price list."
            action={<ButtonLink href="/catalogues/new">Create your first catalogue</ButtonLink>}
          />
        </Card>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">
            {active} active · {packages.length - active} archived
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="flex flex-col transition hover:shadow-raised">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/catalogues/${pkg.id}`}
                      className="font-display text-xl break-words text-foreground hover:text-accent"
                    >
                      {pkg.name}
                    </Link>
                    <p className="tabular mt-1 text-2xl font-medium text-accent-dark">
                      {formatINR(pkg.basePrice)}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                      <Layers className="size-3.5" />
                      {pkg._count.items} item{pkg._count.items === 1 ? "" : "s"}
                    </p>
                  </div>
                  <StatusBadge status={pkg.status} />
                </div>

                {pkg.description ? (
                  <p className="mt-3 line-clamp-2 text-sm text-muted">{pkg.description}</p>
                ) : null}

                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
                  <ButtonLink href={`/catalogues/${pkg.id}`} variant="secondary" size="sm">
                    <FileText className="size-4" />
                    Edit
                  </ButtonLink>
                  <form action={duplicatePackageAction}>
                    <input type="hidden" name="id" value={pkg.id} />
                    <SubmitButton
                      variant="ghost"
                      size="sm"
                      pendingLabel="Copying…"
                      icon={<Copy className="size-4" />}
                    >
                      Duplicate
                    </SubmitButton>
                  </form>
                  <div className="ml-auto">
                    <PdfActions
                      type="catalogue"
                      id={pkg.id}
                      variant="compact"
                      previewLabel="Preview"
                      downloadLabel="PDF"
                      itemCount={pkg._count.items}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
