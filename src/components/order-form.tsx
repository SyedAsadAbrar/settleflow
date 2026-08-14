"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { FieldError } from "@/components/field-error";
import { getApiError } from "@/lib/http/client";
import { formatMoney, parseMoneyToCents } from "@/lib/money";

interface EditableLineItem {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
}

export function OrderForm() {
  const router = useRouter();
  const [items, setItems] = useState<EditableLineItem[]>([{ id: 1, description: "", quantity: "1", unitPrice: "" }]);
  const [nextId, setNextId] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const hasFieldErrors = Object.keys(fieldErrors).some((field) => field !== "request");
  const previewTotal = useMemo(() => items.reduce((sum, item) => {
    const cents = parseMoneyToCents(item.unitPrice) ?? 0;
    const quantity = Number(item.quantity);
    return sum + (Number.isSafeInteger(quantity) && quantity > 0 ? cents * quantity : 0);
  }, 0), [items]);

  function updateItem(id: number, field: keyof Omit<EditableLineItem, "id">, value: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
  }

  function addItem() {
    setItems((current) => [...current, { id: nextId, description: "", quantity: "1", unitPrice: "" }]);
    setNextId((id) => id + 1);
  }

  function removeItem(id: number) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setFieldErrors({});
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form.get("customer"),
          dueDate: form.get("dueDate"),
          lineItems: items.map(({ description, quantity, unitPrice }) => ({ description, quantity, unitPrice })),
        }),
      });
      if (!response.ok) {
        const apiError = await getApiError(response);
        setError(apiError.message);
        setFieldErrors(apiError.details);
        return;
      }
      const payload = (await response.json()) as { data: { order: { id: string } } };
      router.push(`/orders/${payload.data.order.id}`);
      router.refresh();
    } catch {
      setError("Unable to save the order. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-7 flex items-center gap-3">
        <Link href="/dashboard" className="grid size-10 place-items-center rounded-lg border border-[#d9e1dd] bg-white text-[#4f6158] hover:bg-[#f8faf9]" aria-label="Back to orders"><ArrowLeft className="size-4" /></Link>
        <div><p className="text-sm font-semibold text-[#176b4d]">New order</p><h1 className="text-3xl font-bold tracking-[-0.035em]">Create an order</h1></div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_310px]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="font-semibold">Order details</h2><p className="mt-1 text-sm text-[#6b7973]">Who is being billed and when is payment due?</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="customer">Customer</label>
                <input className="field" id="customer" name="customer" required maxLength={200} placeholder="Acme Corporation" aria-invalid={Boolean(fieldErrors.customer)} aria-describedby={fieldErrors.customer ? "customer-error" : undefined} />
                <FieldError id="customer-error" message={fieldErrors.customer} />
              </div>
              <div>
                <label className="label" htmlFor="dueDate">Due date</label>
                <input className="field" id="dueDate" name="dueDate" type="date" required aria-invalid={Boolean(fieldErrors.dueDate)} aria-describedby={fieldErrors.dueDate ? "due-date-error" : undefined} />
                <FieldError id="due-date-error" message={fieldErrors.dueDate} />
              </div>
            </div>
          </section>
          <section className="card overflow-hidden">
            <div className="border-b border-[#e4eae7] p-5 sm:p-6">
              <h2 className="font-semibold">Line items</h2>
              <p className="mt-1 text-sm text-[#6b7973]">The server will calculate and store the authoritative total.</p>
              <FieldError message={fieldErrors.lineItems} />
            </div>
            <div className="divide-y divide-[#e8edea]">
              {items.map((item, index) => (
                <LineItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  canRemove={items.length > 1}
                  fieldErrors={fieldErrors}
                  onChange={updateItem}
                  onRemove={removeItem}
                />
              ))}
            </div>
            <div className="bg-[#fafbfa] px-5 py-4 sm:px-6"><button type="button" className="btn-secondary" onClick={addItem}><Plus className="size-4" />Add line item</button></div>
          </section>
        </div>
        <aside className="card p-5 lg:sticky lg:top-24">
          <p className="text-sm font-medium text-[#687770]">Order total</p><p className="mt-2 text-3xl font-bold tracking-[-0.04em]">{formatMoney(previewTotal)}</p>
          <p className="mt-3 text-xs leading-5 text-[#829089]">This preview is for convenience. Totals are recalculated from integer cents by the API.</p>
          {error && !hasFieldErrors ? <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p> : null}
          <button type="submit" className="btn-primary mt-5 w-full" disabled={submitting}>{submitting ? <LoaderCircle className="size-4 animate-spin" /> : null}{submitting ? "Creating…" : "Create order"}</button>
          <Link href="/dashboard" className="btn-secondary mt-2 w-full">Cancel</Link>
        </aside>
      </div>
    </form>
  );
}

function LineItemRow({
  item,
  index,
  canRemove,
  fieldErrors,
  onChange,
  onRemove,
}: {
  item: EditableLineItem;
  index: number;
  canRemove: boolean;
  fieldErrors: Record<string, string>;
  onChange: (id: number, field: keyof Omit<EditableLineItem, "id">, value: string) => void;
  onRemove: (id: number) => void;
}) {
  const descriptionError = fieldErrors[`lineItems.${index}.description`];
  const quantityError = fieldErrors[`lineItems.${index}.quantity`];
  const unitPriceError = fieldErrors[`lineItems.${index}.unitPrice`];

  return (
    <div className="grid gap-4 p-5 sm:grid-cols-[1fr_110px_150px_40px] sm:items-end sm:p-6">
      <div>
        <label className="label" htmlFor={`description-${item.id}`}>Description</label>
        <input className="field" id={`description-${item.id}`} value={item.description} onChange={(event) => onChange(item.id, "description", event.target.value)} required maxLength={200} placeholder={`Item ${index + 1}`} aria-invalid={Boolean(descriptionError)} aria-describedby={descriptionError ? `description-${item.id}-error` : undefined} />
        <FieldError id={`description-${item.id}-error`} message={descriptionError} />
      </div>
      <div>
        <label className="label" htmlFor={`quantity-${item.id}`}>Quantity</label>
        <input className="field" id={`quantity-${item.id}`} type="number" min="1" step="1" value={item.quantity} onChange={(event) => onChange(item.id, "quantity", event.target.value)} required aria-invalid={Boolean(quantityError)} aria-describedby={quantityError ? `quantity-${item.id}-error` : undefined} />
        <FieldError id={`quantity-${item.id}-error`} message={quantityError} />
      </div>
      <div>
        <label className="label" htmlFor={`price-${item.id}`}>Unit price (USD)</label>
        <input className="field" id={`price-${item.id}`} type="number" min="0" step="0.01" inputMode="decimal" value={item.unitPrice} onChange={(event) => onChange(item.id, "unitPrice", event.target.value)} required placeholder="0.00" aria-invalid={Boolean(unitPriceError)} aria-describedby={unitPriceError ? `price-${item.id}-error` : undefined} />
        <FieldError id={`price-${item.id}-error`} message={unitPriceError} />
      </div>
      <button type="button" onClick={() => onRemove(item.id)} disabled={!canRemove} className="grid size-10 place-items-center rounded-lg text-[#829089] hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30" aria-label={`Remove item ${index + 1}`}><Trash2 className="size-4" /></button>
    </div>
  );
}
