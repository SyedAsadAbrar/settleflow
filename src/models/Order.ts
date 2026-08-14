import { Schema, model, models, type InferSchemaType } from "mongoose";

const lineItemSchema = new Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPriceCents: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    customer: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    lineItems: { type: [lineItemSchema], required: true },
    totalCents: { type: Number, required: true, min: 0 },
    paymentVersion: { type: Number, required: true, default: 0, select: false },
  },
  { timestamps: true },
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ userId: 1, dueDate: 1 });

export type OrderDocument = InferSchemaType<typeof orderSchema>;

export const Order = models.Order ?? model("Order", orderSchema);
