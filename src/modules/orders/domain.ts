import type { LineItemInput, OrderStatus } from "@/types/order";

export function calculateOrderTotalCents(lineItems: LineItemInput[]): number {
  const total = lineItems.reduce((sum, item) => {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      throw new Error("Line item quantity must be a positive integer.");
    }
    if (!Number.isSafeInteger(item.unitPriceCents) || item.unitPriceCents < 0) {
      throw new Error("Line item unit price must be a non-negative integer number of cents.");
    }

    const lineTotal = item.quantity * item.unitPriceCents;
    if (!Number.isSafeInteger(lineTotal)) {
      throw new Error("Line item total exceeds the supported monetary range.");
    }
    return sum + lineTotal;
  }, 0);

  if (!Number.isSafeInteger(total)) {
    throw new Error("Order total exceeds the supported monetary range.");
  }
  return total;
}

export function isPastDueDate(dueDate: Date, now: Date): boolean {
  const dueDayUtc = Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate());
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return dueDayUtc < todayUtc;
}

export function deriveOrderStatus(
  totalCents: number,
  amountPaidCents: number,
  dueDate: Date,
  now = new Date(),
): OrderStatus {
  if (amountPaidCents >= totalCents) return "paid";
  if (isPastDueDate(dueDate, now)) return "overdue";
  if (amountPaidCents > 0) return "partially_paid";
  return "pending";
}

export function getAmountDueCents(totalCents: number, amountPaidCents: number): number {
  return Math.max(0, totalCents - amountPaidCents);
}
