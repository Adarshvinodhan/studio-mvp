import { Building2, ImageIcon, Landmark, ScrollText, Trash2 } from "lucide-react";
import { getBusinessSettings } from "@/lib/counters";
import { prisma } from "@/lib/prisma";
import {
  deletePortfolioImageAction,
  updateSettingsAction,
  uploadPortfolioImageAction,
} from "@/lib/actions/settings";
import {
  Alert,
  ConfirmSubmit,
  EmptyState,
  Field,
  FormActions,
  PageHeader,
  Panel,
  SubmitButton,
  inputClass,
} from "@/components/ui";

export default async function SettingsPage() {
  const [settings, images] = await Promise.all([
    getBusinessSettings(),
    prisma.portfolioImage.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Settings"
        description="Business details, bank info and default terms used across every PDF"
      />

      <form
        action={updateSettingsAction}
        encType="multipart/form-data"
        className="space-y-5"
      >
        <Panel
          title="Business identity"
          description="Appears in the header of quotations, catalogues and receipts"
          icon={<Building2 className="size-4" />}
        >
          <div className="space-y-5">
            <Field label="Business name" required>
              <input
                name="businessName"
                required
                defaultValue={settings.businessName}
                className={inputClass}
              />
            </Field>
            <Field label="Address">
              <textarea
                name="address"
                rows={2}
                defaultValue={settings.address ?? ""}
                className={inputClass}
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Phone">
                <input
                  name="phone"
                  type="tel"
                  defaultValue={settings.phone ?? ""}
                  className={inputClass}
                />
              </Field>
              <Field label="Email">
                <input
                  name="email"
                  type="email"
                  defaultValue={settings.email ?? ""}
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Quotation prefix"
                hint="Numbers look like PREFIX-Q-0001"
              >
                <input
                  name="quotationPrefix"
                  defaultValue={settings.quotationPrefix}
                  className={inputClass}
                />
              </Field>
              <Field label="Logo" hint="PNG or JPG, ideally transparent">
                <input
                  name="logo"
                  type="file"
                  accept="image/*"
                  className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-accent-soft file:px-2 file:py-1 file:text-sm file:text-accent-dark`}
                />
              </Field>
            </div>
            {settings.logo ? (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/uploads/${settings.logo}`}
                  alt="Current logo"
                  className="h-12 w-auto object-contain"
                />
                <p className="text-xs text-muted">
                  Current logo. Choosing a new file replaces it on save.
                </p>
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel
          title="Bank & payment details"
          description="Printed on quotations so clients know where to pay"
          icon={<Landmark className="size-4" />}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Account holder">
              <input
                name="bankHolderName"
                defaultValue={settings.bankHolderName ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Account number">
              <input
                name="bankAccountNumber"
                defaultValue={settings.bankAccountNumber ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="IFSC">
              <input name="ifsc" defaultValue={settings.ifsc ?? ""} className={inputClass} />
            </Field>
            <Field label="GPay / UPI">
              <input
                name="upiNumber"
                defaultValue={settings.upiNumber ?? ""}
                className={inputClass}
              />
            </Field>
          </div>
        </Panel>

        <Panel
          title="Default terms & conditions"
          description="Pre-filled into every new quotation; editable per quotation"
          icon={<ScrollText className="size-4" />}
        >
          <Field label="Terms">
            <textarea
              name="defaultTerms"
              rows={12}
              defaultValue={settings.defaultTerms ?? ""}
              className={inputClass}
            />
          </Field>
          <FormActions className="mt-5">
            <SubmitButton pendingLabel="Saving…">Save all settings</SubmitButton>
            <p className="text-xs text-muted">Saves every section on this page.</p>
          </FormActions>
        </Panel>
      </form>

      <Panel
        title="Portfolio images"
        description="Stored for use in catalogue and quotation PDFs"
        icon={<ImageIcon className="size-4" />}
      >
        {images.length === 0 ? (
          <EmptyState
            icon={<ImageIcon className="size-5" />}
            message="No images uploaded yet."
          />
        ) : (
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-xl border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/uploads/${image.filePath}`}
                  alt={image.name}
                  className="aspect-square w-full object-cover"
                />
                <form
                  action={deletePortfolioImageAction}
                  className="absolute inset-x-0 bottom-0 bg-sidebar/75 p-1.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100"
                >
                  <input type="hidden" name="id" value={image.id} />
                  <ConfirmSubmit
                    variant="danger-ghost"
                    size="sm"
                    className="w-full text-white hover:bg-white/15"
                    title="Remove this image?"
                    description="The file is deleted from disk and removed from any PDF that used it."
                    confirmLabel="Remove image"
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </ConfirmSubmit>
                </form>
              </div>
            ))}
          </div>
        )}

        <form
          action={uploadPortfolioImageAction}
          encType="multipart/form-data"
          className="flex flex-col gap-3 border-t border-border/70 pt-5 sm:flex-row sm:items-end"
        >
          <Field label="Upload image" className="flex-1">
            <input
              name="image"
              type="file"
              accept="image/*"
              required
              className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-accent-soft file:px-2 file:py-1 file:text-sm file:text-accent-dark`}
            />
          </Field>
          <SubmitButton variant="secondary" pendingLabel="Uploading…">
            Upload
          </SubmitButton>
        </form>
      </Panel>

      <Alert tone="info">
        Login credentials are configured through environment variables, not here.
      </Alert>
    </div>
  );
}
