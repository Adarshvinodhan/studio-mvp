import { UserPlus } from "lucide-react";
import { createCustomerAction } from "@/lib/actions/customers";
import {
  Card,
  Field,
  FormActions,
  PageHeader,
  SubmitButton,
  inputClass,
} from "@/components/ui";

export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        breadcrumbs={[{ label: "Customers", href: "/customers" }, { label: "New" }]}
        title="Add customer"
        description="Only the name is required — you can fill in the rest later."
      />
      <Card>
        <form action={createCustomerAction} className="space-y-5">
          <Field label="Name" required>
            <input name="name" required autoFocus className={inputClass} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Phone">
              <input name="phone" type="tel" className={inputClass} placeholder="+91…" />
            </Field>
            <Field label="WhatsApp" hint="Leave blank if same as phone">
              <input name="whatsapp" type="tel" className={inputClass} />
            </Field>
          </div>
          <Field label="Email">
            <input name="email" type="email" className={inputClass} />
          </Field>
          <Field label="Address">
            <textarea name="address" rows={2} className={inputClass} />
          </Field>
          <Field label="Notes" hint="Preferences, referral source, anything useful">
            <textarea name="notes" rows={3} className={inputClass} />
          </Field>
          <FormActions>
            <SubmitButton pendingLabel="Saving…" icon={<UserPlus className="size-4" />}>
              Save customer
            </SubmitButton>
          </FormActions>
        </form>
      </Card>
    </div>
  );
}
