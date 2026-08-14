"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { FieldError } from "@/components/field-error";
import { getApiError } from "@/lib/http/client";
import { formatMoney } from "@/lib/money";

export function PaymentForm({ orderId, amountDueCents, today }: { orderId: string; amountDueCents: number; today: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const hasFieldErrors = Object.keys(fieldErrors).some((field) => field !== "request");

  if (amountDueCents === 0) {
    return <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800"><span className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-4" />Order fully paid</span><p className="mt-1 text-emerald-700">No remaining balance is available for payment.</p></div>;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setFieldErrors({});
    setSuccess("");
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch(`/api/orders/${orderId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: data.get("amount"), paymentDate: data.get("paymentDate"), note: data.get("note") || undefined }),
      });
      if (!response.ok) {
        const apiError = await getApiError(response);
        setError(apiError.message);
        setFieldErrors(apiError.details);
        return;
      }
      form.reset();
      const dateInput = form.elements.namedItem("paymentDate") as HTMLInputElement | null;
      if (dateInput) dateInput.value = today;
      setSuccess("Payment recorded successfully.");
      router.refresh();
    } catch {
      setError("Unable to record the payment. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg bg-[#f0f5f2] px-3 py-2.5 text-sm text-[#3f544a]">Maximum payment: <strong>{formatMoney(amountDueCents)}</strong></div>
      <div>
        <label className="label" htmlFor="amount">Amount (USD)</label>
        <input className="field" id="amount" name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" max={(amountDueCents / 100).toFixed(2)} required placeholder="0.00" aria-invalid={Boolean(fieldErrors.amount)} aria-describedby={fieldErrors.amount ? "amount-error" : undefined} />
        <FieldError id="amount-error" message={fieldErrors.amount} />
      </div>
      <div>
        <label className="label" htmlFor="paymentDate">Payment date</label>
        <input className="field" id="paymentDate" name="paymentDate" type="date" defaultValue={today} required aria-invalid={Boolean(fieldErrors.paymentDate)} aria-describedby={fieldErrors.paymentDate ? "payment-date-error" : undefined} />
        <FieldError id="payment-date-error" message={fieldErrors.paymentDate} />
      </div>
      <div>
        <label className="label" htmlFor="note">Note <span className="font-normal text-[#8a9791]">(optional)</span></label>
        <textarea className="field min-h-20 resize-y" id="note" name="note" maxLength={500} placeholder="Bank transfer, reference…" aria-invalid={Boolean(fieldErrors.note)} aria-describedby={fieldErrors.note ? "note-error" : undefined} />
        <FieldError id="note-error" message={fieldErrors.note} />
      </div>
      {error && !hasFieldErrors ? <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p> : null}
      {success ? <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">{success}</p> : null}
      <button className="btn-primary w-full" type="submit" disabled={submitting}>{submitting ? <LoaderCircle className="size-4 animate-spin" /> : null}{submitting ? "Recording…" : "Record payment"}</button>
    </form>
  );
}
