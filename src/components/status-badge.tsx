import type { OrderStatus } from "@/types/order";

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-slate-100 text-slate-700",
  partially_paid: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  paid: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  overdue: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  partially_paid: "Partially paid",
  paid: "Paid",
  overdue: "Overdue",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
