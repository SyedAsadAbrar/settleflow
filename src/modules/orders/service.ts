import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ApiError } from "@/lib/http/api-error";
import { Order } from "@/models/Order";
import { Payment } from "@/models/Payment";
import {
  assertOrderEditable,
  calculateOrderTotalCents,
  deriveOrderStatus,
  getAmountDueCents,
} from "@/modules/orders/domain";
import type { ParsedOrderInput } from "@/modules/orders/schemas";
import type { LineItemInput, OrderStatus, OrderView, PaymentView } from "@/types/order";

interface LeanOrder {
  _id: Types.ObjectId;
  customer: string;
  dueDate: Date;
  lineItems: LineItemInput[];
  totalCents: number;
  createdAt: Date;
  updatedAt: Date;
}

interface LeanPayment {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  amountCents: number;
  paymentDate: Date;
  note?: string;
  createdAt: Date;
}

function toLineItems(input: ParsedOrderInput): LineItemInput[] {
  return input.lineItems.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPriceCents: item.unitPrice,
  }));
}

function serializeOrder(order: LeanOrder, amountPaidCents: number, now = new Date()): OrderView {
  return {
    id: order._id.toString(),
    customer: order.customer,
    dueDate: order.dueDate.toISOString().slice(0, 10),
    lineItems: order.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
    })),
    totalCents: order.totalCents,
    amountPaidCents,
    amountDueCents: getAmountDueCents(order.totalCents, amountPaidCents),
    status: deriveOrderStatus(order.totalCents, amountPaidCents, order.dueDate, now),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function serializePayment(payment: LeanPayment): PaymentView {
  return {
    id: payment._id.toString(),
    orderId: payment.orderId.toString(),
    amountCents: payment.amountCents,
    paymentDate: payment.paymentDate.toISOString().slice(0, 10),
    ...(payment.note ? { note: payment.note } : {}),
    createdAt: payment.createdAt.toISOString(),
  };
}

function assertValidObjectId(id: string): void {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "INVALID_ID", "The order ID is invalid.");
  }
}

export async function createOrder(userId: string, input: ParsedOrderInput): Promise<OrderView> {
  await connectToDatabase();
  const lineItems = toLineItems(input);
  const totalCents = calculateOrderTotalCents(lineItems);
  const order = await Order.create({
    userId,
    customer: input.customer,
    dueDate: new Date(`${input.dueDate}T00:00:00.000Z`),
    lineItems,
    totalCents,
  });
  return serializeOrder(order.toObject() as LeanOrder, 0);
}

export async function listOrders(userId: string, status?: OrderStatus): Promise<OrderView[]> {
  await connectToDatabase();
  const [orders, totals] = await Promise.all([
    Order.find({ userId }).sort({ createdAt: -1 }).lean<LeanOrder[]>(),
    Payment.aggregate<{ _id: Types.ObjectId; amountPaidCents: number }>([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $group: { _id: "$orderId", amountPaidCents: { $sum: "$amountCents" } } },
    ]),
  ]);
  const paidByOrder = new Map(totals.map((total) => [total._id.toString(), total.amountPaidCents]));
  const now = new Date();
  const views = orders.map((order) => serializeOrder(order, paidByOrder.get(order._id.toString()) ?? 0, now));
  return status ? views.filter((order) => order.status === status) : views;
}

export async function getOrder(userId: string, orderId: string): Promise<{ order: OrderView; payments: PaymentView[] }> {
  assertValidObjectId(orderId);
  await connectToDatabase();
  const [order, payments] = await Promise.all([
    Order.findOne({ _id: orderId, userId }).lean<LeanOrder | null>(),
    Payment.find({ orderId, userId }).sort({ paymentDate: -1, createdAt: -1 }).lean<LeanPayment[]>(),
  ]);
  if (!order) throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found.");
  const amountPaidCents = payments.reduce((sum, payment) => sum + payment.amountCents, 0);
  return { order: serializeOrder(order, amountPaidCents), payments: payments.map(serializePayment) };
}

export async function updateOrder(userId: string, orderId: string, input: ParsedOrderInput): Promise<OrderView> {
  assertValidObjectId(orderId);
  const db = await connectToDatabase();
  const session = await db.startSession();
  let updatedOrder: LeanOrder | null = null;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({ _id: orderId, userId }).select("+paymentVersion").session(session);
      if (!order) throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found.");

      const paymentCount = await Payment.countDocuments({ orderId, userId }).session(session);
      try {
        assertOrderEditable(paymentCount);
      } catch {
        throw new ApiError(409, "ORDER_LOCKED", "Orders cannot be modified after a payment has been recorded.");
      }

      const lineItems = toLineItems(input);
      const result = await Order.findOneAndUpdate(
        { _id: order._id, userId, paymentVersion: order.paymentVersion },
        {
          $set: {
            customer: input.customer,
            dueDate: new Date(`${input.dueDate}T00:00:00.000Z`),
            lineItems,
            totalCents: calculateOrderTotalCents(lineItems),
          },
          $inc: { paymentVersion: 1 },
        },
        { new: true, session },
      ).lean<LeanOrder | null>();
      if (!result) throw new Error("Order changed concurrently; retrying transaction.");
      updatedOrder = result;
    });
  } finally {
    await session.endSession();
  }

  if (!updatedOrder) throw new Error("Order update transaction did not produce a result.");
  return serializeOrder(updatedOrder, 0);
}

export async function deleteOrder(userId: string, orderId: string): Promise<void> {
  assertValidObjectId(orderId);
  const db = await connectToDatabase();
  const session = await db.startSession();

  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({ _id: orderId, userId }).select("+paymentVersion").session(session);
      if (!order) throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found.");
      const paymentCount = await Payment.countDocuments({ orderId, userId }).session(session);
      if (paymentCount > 0) {
        throw new ApiError(409, "ORDER_LOCKED", "Orders cannot be deleted after a payment has been recorded.");
      }
      const result = await Order.deleteOne({
        _id: order._id,
        userId,
        paymentVersion: order.paymentVersion,
      }).session(session);
      if (result.deletedCount !== 1) throw new Error("Order changed concurrently; retrying transaction.");
    });
  } finally {
    await session.endSession();
  }
}
