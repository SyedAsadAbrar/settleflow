import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ApiError } from "@/lib/http/api-error";
import { Order } from "@/models/Order";
import { Payment } from "@/models/Payment";
import { deriveOrderStatus, getAmountDueCents } from "@/modules/orders/domain";
import { validatePayment } from "@/modules/payments/domain";
import type { ParsedPaymentInput } from "@/modules/payments/schemas";
import type { PaymentView } from "@/types/order";

interface CreatedPayment {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  amountCents: number;
  paymentDate: Date;
  note?: string;
  createdAt: Date;
}

export async function recordPayment(userId: string, orderId: string, input: ParsedPaymentInput) {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new ApiError(400, "INVALID_ID", "The order ID is invalid.");
  }

  const db = await connectToDatabase();
  const session = await db.startSession();
  let result: {
    payment: PaymentView;
    amountPaidCents: number;
    amountDueCents: number;
    status: ReturnType<typeof deriveOrderStatus>;
  } | null = null;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({ _id: orderId, userId }).select("+paymentVersion").session(session);
      if (!order) throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found.");

      const totals = await Payment.aggregate<{ amountPaidCents: number }>([
        { $match: { orderId: order._id, userId: new Types.ObjectId(userId) } },
        { $group: { _id: null, amountPaidCents: { $sum: "$amountCents" } } },
      ]).session(session);
      const currentPaidCents = totals[0]?.amountPaidCents ?? 0;
      const validation = validatePayment(input.amount, order.totalCents, currentPaidCents);
      const remainingAmountCents = getAmountDueCents(order.totalCents, currentPaidCents);

      if (!validation.ok) {
        if (validation.code === "PAYMENT_EXCEEDS_BALANCE") {
          throw new ApiError(409, validation.code, "Payment exceeds the remaining balance.", {
            remainingAmountCents,
          });
        }
        if (validation.code === "ORDER_ALREADY_PAID") {
          throw new ApiError(409, validation.code, "This order is already fully paid.", {
            remainingAmountCents: 0,
          });
        }
        throw new ApiError(400, validation.code, "Payment amount must be greater than zero.");
      }

      // This write makes concurrent payment transactions contend on one document.
      const lock = await Order.updateOne(
        { _id: order._id, userId, paymentVersion: order.paymentVersion },
        { $inc: { paymentVersion: 1 } },
        { session },
      );
      if (lock.modifiedCount !== 1) throw new Error("Concurrent payment detected; retrying transaction.");

      const [paymentDocument] = await Payment.create(
        [
          {
            userId,
            orderId: order._id,
            amountCents: input.amount,
            paymentDate: new Date(`${input.paymentDate}T00:00:00.000Z`),
            ...(input.note ? { note: input.note } : {}),
          },
        ],
        { session },
      );
      const payment = paymentDocument.toObject() as CreatedPayment;
      const amountPaidCents = currentPaidCents + input.amount;
      result = {
        payment: {
          id: payment._id.toString(),
          orderId: payment.orderId.toString(),
          amountCents: payment.amountCents,
          paymentDate: payment.paymentDate.toISOString().slice(0, 10),
          ...(payment.note ? { note: payment.note } : {}),
          createdAt: payment.createdAt.toISOString(),
        },
        amountPaidCents,
        amountDueCents: getAmountDueCents(order.totalCents, amountPaidCents),
        status: deriveOrderStatus(order.totalCents, amountPaidCents, order.dueDate),
      };
    });
  } finally {
    await session.endSession();
  }

  if (!result) throw new Error("Payment transaction did not produce a result.");
  return result;
}
