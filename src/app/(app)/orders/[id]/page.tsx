import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, LockKeyhole } from "lucide-react";
import { PaymentForm } from "@/components/payment-form";
import { StatusBadge } from "@/components/status-badge";
import { requireUserId } from "@/lib/auth/session";
import { formatDate } from "@/lib/date";
import { ApiError } from "@/lib/http/api-error";
import { formatMoney } from "@/lib/money";
import { getOrder } from "@/modules/orders/service";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  let data: Awaited<ReturnType<typeof getOrder>>;
  try {
    data = await getOrder(userId, id);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.code === "INVALID_ID")) notFound();
    throw error;
  }
  const { order, payments } = data;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="flex items-start gap-3">
          <Link href="/dashboard" className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg border border-[#d9e1dd] bg-white text-[#4f6158] hover:bg-[#f8faf9]" aria-label="Back to orders"><ArrowLeft className="size-4" /></Link>
          <div><div className="mb-2 flex flex-wrap items-center gap-2"><StatusBadge status={order.status} /><span className="text-xs font-medium text-[#84918b]">#{order.id.slice(-6).toUpperCase()}</span></div><h1 className="text-3xl font-bold tracking-[-0.035em]">{order.customer}</h1><p className="mt-2 flex items-center gap-1.5 text-sm text-[#66756e]"><CalendarDays className="size-4" />Due {formatDate(order.dueDate)}</p></div>
        </div>
      </div>

      <section aria-label="Order balance" className="mt-8 grid overflow-hidden rounded-xl border border-[#dfe6e2] bg-white sm:grid-cols-3">
        <Metric label="Order total" value={formatMoney(order.totalCents)} />
        <Metric label="Amount paid" value={formatMoney(order.amountPaidCents)} bordered />
        <Metric label="Remaining" value={formatMoney(order.amountDueCents)} bordered />
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#e4eae7] px-5 py-4 sm:px-6"><div><h2 className="font-semibold">Line items</h2><p className="mt-0.5 text-xs text-[#74827c]">{order.lineItems.length} {order.lineItems.length === 1 ? "item" : "items"}</p></div>{payments.length ? <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#74827c]"><LockKeyhole className="size-3.5" />Financial fields locked</span> : null}</div>
            <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left"><thead className="bg-[#fafbfa] text-xs font-semibold uppercase tracking-[0.05em] text-[#74827c]"><tr><th className="px-5 py-3 sm:px-6">Description</th><th className="px-5 py-3 text-right">Qty</th><th className="px-5 py-3 text-right">Unit price</th><th className="px-5 py-3 text-right sm:px-6">Amount</th></tr></thead><tbody className="divide-y divide-[#e8edea]">{order.lineItems.map((item, index) => <tr key={`${item.description}-${index}`}><td className="px-5 py-4 text-sm font-medium sm:px-6">{item.description}</td><td className="px-5 py-4 text-right text-sm text-[#63716a]">{item.quantity}</td><td className="px-5 py-4 text-right text-sm text-[#63716a]">{formatMoney(item.unitPriceCents)}</td><td className="px-5 py-4 text-right text-sm font-semibold sm:px-6">{formatMoney(item.unitPriceCents * item.quantity)}</td></tr>)}</tbody><tfoot><tr className="border-t border-[#dfe6e2] bg-[#fafbfa]"><td colSpan={3} className="px-5 py-4 text-right text-sm font-semibold sm:px-6">Total</td><td className="px-5 py-4 text-right font-bold sm:px-6">{formatMoney(order.totalCents)}</td></tr></tfoot></table></div>
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-[#e4eae7] px-5 py-4 sm:px-6"><h2 className="font-semibold">Payment history</h2><p className="mt-0.5 text-xs text-[#74827c]">{payments.length} recorded {payments.length === 1 ? "payment" : "payments"}</p></div>
            {payments.length ? <div className="divide-y divide-[#e8edea]">{payments.map((payment) => <div key={payment.id} className="flex items-start justify-between gap-5 px-5 py-4 sm:px-6"><div><p className="text-sm font-semibold">{formatDate(payment.paymentDate)}</p><p className="mt-1 text-xs text-[#74827c]">{payment.note || "No note"}</p></div><p className="font-semibold text-[#176b4d]">{formatMoney(payment.amountCents)}</p></div>)}</div> : <div className="px-6 py-10 text-center"><p className="text-sm font-medium">No payments recorded</p><p className="mt-1 text-sm text-[#74827c]">Payments will appear here in settlement order.</p></div>}
          </section>
        </div>

        <aside className="card p-5 lg:sticky lg:top-24"><h2 className="font-semibold">Record payment</h2><p className="mb-5 mt-1 text-sm leading-5 text-[#6b7973]">Apply a settlement against this order&apos;s remaining balance.</p><PaymentForm orderId={order.id} amountDueCents={order.amountDueCents} today={today} /></aside>
      </div>
    </div>
  );
}

function Metric({ label, value, bordered = false }: { label: string; value: string; bordered?: boolean }) {
  return <div className={`px-5 py-5 sm:px-6 ${bordered ? "border-t border-[#e4eae7] sm:border-l sm:border-t-0" : ""}`}><p className="text-sm font-medium text-[#6c7a73]">{label}</p><p className="mt-2 text-2xl font-bold tracking-[-0.03em]">{value}</p></div>;
}
