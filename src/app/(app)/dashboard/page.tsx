import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleDollarSign, FilePlus2, Plus } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { requireUserId } from "@/lib/auth/session";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/money";
import { listOrders } from "@/modules/orders/service";
import { ORDER_STATUSES, type OrderStatus } from "@/types/order";

export const metadata: Metadata = { title: "Dashboard" };

const filters: Array<{ label: string; value?: OrderStatus }> = [
  { label: "All" },
  { label: "Pending", value: "pending" },
  { label: "Partially paid", value: "partially_paid" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
];

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const userId = await requireUserId();
  const requestedStatus = (await searchParams).status;
  const status = ORDER_STATUSES.includes(requestedStatus as OrderStatus) ? (requestedStatus as OrderStatus) : undefined;
  const allOrders = await listOrders(userId);
  const orders = status ? allOrders.filter((order) => order.status === status) : allOrders;
  const outstandingCents = allOrders.reduce((sum, order) => sum + order.amountDueCents, 0);
  const overdueCents = allOrders.filter((order) => order.status === "overdue").reduce((sum, order) => sum + order.amountDueCents, 0);
  const paidCount = allOrders.filter((order) => order.status === "paid").length;

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm font-semibold text-[#176b4d]">Overview</p>
          <h1 className="text-3xl font-bold tracking-[-0.035em]">Orders</h1>
          <p className="mt-2 text-sm text-[#66756e]">Monitor balances and record customer settlements.</p>
        </div>
        <Link href="/orders/new" className="btn-primary"><Plus className="size-4" />Create order</Link>
      </div>

      <section aria-label="Order summary" className="mt-8 grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total outstanding" value={formatMoney(outstandingCents)} icon={<CircleDollarSign className="size-5" />} />
        <SummaryCard label="Overdue amount" value={formatMoney(overdueCents)} icon={<AlertTriangle className="size-5" />} tone="danger" />
        <SummaryCard label="Paid orders" value={String(paidCount)} icon={<CheckCircle2 className="size-5" />} tone="success" />
      </section>

      <section className="card mt-6 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[#e4eae7] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold">All orders</h2>
            <p className="mt-0.5 text-xs text-[#74827c]">{orders.length} {orders.length === 1 ? "order" : "orders"}</p>
          </div>
          <nav aria-label="Filter orders" className="flex max-w-full gap-1 overflow-x-auto rounded-lg bg-[#f2f5f3] p-1">
            {filters.map((filter) => {
              const active = filter.value === status || (!filter.value && !status);
              return (
                <Link
                  key={filter.label}
                  href={filter.value ? `/dashboard?status=${filter.value}` : "/dashboard"}
                  className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold ${active ? "bg-white text-[#22382e] shadow-sm" : "text-[#687770] hover:text-[#22382e]"}`}
                >
                  {filter.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {orders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse text-left">
              <thead className="bg-[#fafbfa] text-xs font-semibold uppercase tracking-[0.05em] text-[#74827c]">
                <tr>
                  <th className="px-5 py-3">Customer</th><th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th><th className="px-5 py-3 text-right">Paid</th>
                  <th className="px-5 py-3 text-right">Due</th><th className="px-5 py-3">Due date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8edea]">
                {orders.map((order) => (
                  <tr key={order.id} className="group hover:bg-[#f9fbfa]">
                    <td className="px-5 py-4"><Link href={`/orders/${order.id}`} className="font-semibold text-[#22382e] group-hover:text-[#176b4d]">{order.customer}</Link><p className="mt-0.5 text-xs text-[#8a9791]">#{order.id.slice(-6).toUpperCase()}</p></td>
                    <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-4 text-right text-sm font-medium">{formatMoney(order.totalCents)}</td>
                    <td className="px-5 py-4 text-right text-sm text-[#57675f]">{formatMoney(order.amountPaidCents)}</td>
                    <td className="px-5 py-4 text-right text-sm font-semibold">{formatMoney(order.amountDueCents)}</td>
                    <td className="px-5 py-4 text-sm text-[#57675f]">{formatDate(order.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
            <div><span className="mx-auto grid size-12 place-items-center rounded-xl bg-[#edf4f0] text-[#176b4d]"><FilePlus2 className="size-5" /></span><h3 className="mt-4 font-semibold">{status ? "No matching orders" : "Create your first order"}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#66756e]">{status ? "Try another status filter to find what you need." : "Add customer line items and start tracking payments in one place."}</p>{!status ? <Link href="/orders/new" className="btn-secondary mt-5">Create order</Link> : null}</div>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value, icon, tone = "default" }: { label: string; value: string; icon: React.ReactNode; tone?: "default" | "danger" | "success" }) {
  const toneClasses = tone === "danger" ? "bg-rose-50 text-rose-700" : tone === "success" ? "bg-emerald-50 text-emerald-700" : "bg-[#edf4f0] text-[#176b4d]";
  return <div className="card flex items-center justify-between p-5"><div><p className="text-sm font-medium text-[#697871]">{label}</p><p className="mt-2 text-2xl font-bold tracking-[-0.03em]">{value}</p></div><span className={`grid size-10 place-items-center rounded-lg ${toneClasses}`}>{icon}</span></div>;
}
