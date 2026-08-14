import type { PaymentView } from "@/types/order";

interface PaymentForView {
  _id: { toString(): string };
  orderId: { toString(): string };
  amountCents: number;
  paymentDate: Date;
  note?: string;
  createdAt: Date;
}

export function toPaymentView(payment: PaymentForView): PaymentView {
  return {
    id: payment._id.toString(),
    orderId: payment.orderId.toString(),
    amountCents: payment.amountCents,
    paymentDate: payment.paymentDate.toISOString().slice(0, 10),
    ...(payment.note ? { note: payment.note } : {}),
    createdAt: payment.createdAt.toISOString(),
  };
}
