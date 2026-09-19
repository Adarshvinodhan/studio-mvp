"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, FileText, Package, UserRound } from "lucide-react";
import { createQuotationAction } from "@/lib/actions/quotations";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/cn";
import { Combobox, type ComboOption } from "@/components/combobox";
import { SubmitButton } from "@/components/submit-button";

export type CustomerChoice = {
  id: string;
  name: string;
  phone: string | null;
  events: { id: string; label: string; hint: string }[];
};

export type PackageChoice = {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  itemCount: number;
};

export function NewQuotationForm({
  customers,
  packages,
  defaultCustomerId,
}: {
  customers: CustomerChoice[];
  packages: PackageChoice[];
  defaultCustomerId?: string;
}) {
  const [customerId, setCustomerId] = useState(
    () => defaultCustomerId ?? customers[0]?.id ?? "",
  );
  const [eventId, setEventId] = useState("");
  const [packageId, setPackageId] = useState("");

  const customer = customers.find((item) => item.id === customerId);

  const customerOptions: ComboOption[] = useMemo(
    () =>
      customers.map((item) => ({
        value: item.id,
        label: item.name,
        hint: item.phone ?? undefined,
      })),
    [customers],
  );

  // Events are scoped to the chosen customer — the old flat list mixed clients.
  const eventOptions: ComboOption[] = useMemo(() => {
    const events = customer?.events ?? [];
    return [{ value: "", label: "No specific event" }, ...events.map((event) => ({
      value: event.id,
      label: event.label,
      hint: event.hint,
    }))];
  }, [customer]);

  function chooseCustomer(next: string) {
    setCustomerId(next);
    setEventId("");
  }

  const selectedPackage = packages.find((item) => item.id === packageId);

  return (
    <form action={createQuotationAction} className="space-y-6">
      <fieldset className="space-y-2">
        <legend className="flex items-center gap-2 text-sm font-medium text-foreground">
          <UserRound className="size-4 text-accent" />
          Customer
        </legend>
        <Combobox
          name="customerId"
          required
          options={customerOptions}
          value={customerId}
          onChange={chooseCustomer}
          placeholder="Choose a customer"
          searchPlaceholder="Search by name or phone…"
        />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CalendarDays className="size-4 text-accent" />
          Event
        </legend>
        <Combobox
          name="eventId"
          options={eventOptions}
          value={eventId}
          onChange={setEventId}
          placeholder="No specific event"
          searchPlaceholder="Search events…"
          emptyLabel="This customer has no events yet"
        />
        <p className="text-xs text-muted">
          {customer && customer.events.length === 0 ? (
            <>
              {customer.name} has no events yet.{" "}
              <Link
                href={`/customers/${customer.id}`}
                className="text-accent underline-offset-2 hover:underline"
              >
                Add one on their profile
              </Link>
              .
            </>
          ) : (
            "Optional — links the quotation to a specific shoot."
          )}
        </p>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Package className="size-4 text-accent" />
          Starting point
        </legend>
        <input type="hidden" name="packageId" value={packageId} />
        <div className="grid gap-2 sm:grid-cols-2">
          <PackageCard
            selected={packageId === ""}
            onSelect={() => setPackageId("")}
            title="Blank quotation"
            subtitle="Start from an empty item list"
            icon={<FileText className="size-4" />}
          />
          {packages.map((item) => (
            <PackageCard
              key={item.id}
              selected={packageId === item.id}
              onSelect={() => setPackageId(item.id)}
              title={item.name}
              subtitle={`${item.itemCount} item${item.itemCount === 1 ? "" : "s"} · ${formatINR(item.basePrice)}`}
              icon={<Package className="size-4" />}
            />
          ))}
        </div>
        <p className="text-xs text-muted">
          Items are copied into the quotation. Later catalogue edits will not change it.
        </p>
      </fieldset>

      <div className="rounded-xl border border-border bg-surface/70 p-4 text-sm">
        <p className="mb-2 text-xs font-semibold tracking-[0.1em] text-muted uppercase">
          You&apos;re about to create
        </p>
        <p className="text-foreground">
          A draft quotation for{" "}
          <span className="font-medium">{customer?.name ?? "—"}</span>
          {selectedPackage ? (
            <>
              {" "}
              pre-filled with{" "}
              <span className="font-medium">
                {selectedPackage.itemCount} item
                {selectedPackage.itemCount === 1 ? "" : "s"}
              </span>{" "}
              from {selectedPackage.name} (
              <span className="tabular">{formatINR(selectedPackage.basePrice)}</span>)
            </>
          ) : (
            " with no line items yet"
          )}
          .
        </p>
      </div>

      <SubmitButton
        className="w-full sm:w-auto"
        pendingLabel="Creating…"
        icon={<FileText className="size-4" />}
      >
        Create quotation
      </SubmitButton>
    </form>
  );
}

function PackageCard({
  selected,
  onSelect,
  title,
  subtitle,
  icon,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 text-left transition",
        selected
          ? "border-accent bg-accent-soft/60 ring-2 ring-accent/20"
          : "border-border bg-surface hover:border-border-strong",
      )}
    >
      <span className={cn("mt-0.5", selected ? "text-accent-dark" : "text-muted")}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{title}</span>
        <span className="tabular block truncate text-xs text-muted">{subtitle}</span>
      </span>
      {selected ? <Check className="size-4 shrink-0 text-accent" /> : null}
    </button>
  );
}
