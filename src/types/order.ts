export const ORDER_STATUSES = ["pending", "partially_paid", "paid", "overdue"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface LineItemInput {
  description: string;
  quantity: number;
  unitPriceCents: number;
}

export interface OrderView {
  id: string;
  customer: string;
  dueDate: string;
  lineItems: LineItemInput[];
  totalCents: number;
  amountPaidCents: number;
  amountDueCents: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentView {
  id: string;
  orderId: string;
  amountCents: number;
  paymentDate: string;
  note?: string;
  createdAt: string;
}
