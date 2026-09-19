import { BookOpen } from "lucide-react";
import { createPackageAction } from "@/lib/actions/packages";
import {
  Alert,
  Card,
  Field,
  FormActions,
  PageHeader,
  SubmitButton,
  inputClass,
} from "@/components/ui";

export default function NewCataloguePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        breadcrumbs={[{ label: "Catalogues", href: "/catalogues" }, { label: "New" }]}
        title="New catalogue"
        description="Name the package now — you'll add its items on the next screen."
      />
      <Card>
        <form action={createPackageAction} className="space-y-5">
          <Field label="Package name" required>
            <input
              name="name"
              required
              autoFocus
              placeholder="Premium Wedding Package"
              className={inputClass}
            />
          </Field>
          <Field label="Description" hint="Shown at the top of the catalogue PDF">
            <textarea
              name="description"
              rows={3}
              className={inputClass}
              placeholder="What's included at a glance"
            />
          </Field>
          <Alert tone="info">
            The base price is calculated from the items you add, so there&apos;s nothing to
            enter here.
          </Alert>
          <FormActions>
            <SubmitButton
              pendingLabel="Creating…"
              icon={<BookOpen className="size-4" />}
            >
              Create & add items
            </SubmitButton>
          </FormActions>
        </form>
      </Card>
    </div>
  );
}
