import { Schema, model, models, type InferSchemaType } from "mongoose";

const paymentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    orderId: { type: Schema.Types.ObjectId, required: true, ref: "Order" },
    amountCents: { type: Number, required: true, min: 1 },
    paymentDate: { type: Date, required: true },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

paymentSchema.index({ orderId: 1, createdAt: -1 });
paymentSchema.index({ userId: 1, orderId: 1 });

export type PaymentDocument = InferSchemaType<typeof paymentSchema>;

export const Payment = models.Payment ?? model("Payment", paymentSchema);
