import { notFound } from "next/navigation";
import { BookOpen, Layers, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR, toNumber } from "@/lib/money";
import {
  deletePackageAction,
  savePackageItemsAction,
  updatePackageAction,
} from "@/lib/actions/packages";
import {
  ConfirmSubmit,
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
import { ItemsEditor } from "@/components/items-editor";

export default async function CatalogueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pkg = await prisma.package.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!pkg) notFound();

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[{ label: "Catalogues", href: "/catalogues" }, { label: pkg.name }]}
        title={pkg.name}
        badge={<StatusBadge status={pkg.status} />}
        description="Items here are copied into new quotations — editing this later won't change existing ones."
        actions={
          <>
            <PdfActions type="catalogue" id={pkg.id} itemCount={pkg.items.length} />
            <form action={deletePackageAction}>
              <input type="hidden" name="id" value={pkg.id} />
              <ConfirmSubmit
                variant="danger-ghost"
                size="icon"
                title={`Delete ${pkg.name}?`}
                description="Quotations already created from this catalogue keep their own copies and are unaffected."
                confirmLabel="Delete catalogue"
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Delete catalogue</span>
              </ConfirmSubmit>
            </form>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="Base price" value={formatINR(pkg.basePrice)} tone="accent" />
        <Metric
          label="Items"
          value={String(pkg.items.length)}
          hint="Derived from the list below"
        />
        <Metric label="Status" value={pkg.status === "ACTIVE" ? "Active" : "Archived"} />
      </div>

      <Panel
        title="Package items"
        description="Base price is the sum of every line — it updates when you save."
        icon={<Layers className="size-4" />}
      >
        <ItemsEditor
          items={pkg.items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            category: item.category,
            quantity: toNumber(item.quantity),
            unitPrice: toNumber(item.unitPrice),
          }))}
          showMoneyAdjustments={false}
          totalLabel="Base price"
          save={savePackageItemsAction.bind(null, pkg.id)}
          savedTitle="Catalogue saved"
        />
      </Panel>

      <Panel title="Catalogue details" icon={<BookOpen className="size-4" />}>
        <form action={updatePackageAction} className="space-y-5">
          <input type="hidden" name="id" value={pkg.id} />
          <Field label="Name" required>
            <input name="name" required defaultValue={pkg.name} className={inputClass} />
          </Field>
          <Field label="Description" hint="Shown at the top of the catalogue PDF">
            <textarea
              name="description"
              rows={3}
              defaultValue={pkg.description ?? ""}
              className={inputClass}
            />
          </Field>
          <Field
            label="Status"
            hint="Archived catalogues stay available for reference but can't start new quotations"
          >
            <select name="status" defaultValue={pkg.status} className={inputClass}>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
          <FormActions>
            <SubmitButton pendingLabel="Saving…">Save details</SubmitButton>
          </FormActions>
        </form>
      </Panel>
    </div>
  );
}
