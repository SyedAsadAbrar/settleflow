import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ApiError } from "../src/lib/http/api-error";
import { connectToDatabase } from "../src/lib/db/mongoose";
import { Order } from "../src/models/Order";
import { Payment } from "../src/models/Payment";
import { User } from "../src/models/User";
import { orderInputSchema } from "../src/modules/orders/schemas";
import { createOrder, getOrder } from "../src/modules/orders/service";
import { paymentInputSchema } from "../src/modules/payments/schemas";
import { recordPayment } from "../src/modules/payments/service";

const databaseTestsEnabled = process.env.RUN_DB_TESTS === "1" && Boolean(process.env.MONGODB_URI);
const describeDatabase = databaseTestsEnabled ? describe : describe.skip;

describeDatabase("payment service database integration", () => {
  let userId = "";

  beforeAll(async () => {
    await connectToDatabase();
    const user = await User.create({
      email: `integration-${randomUUID()}@example.invalid`,
      passwordHash: "integration-test-only",
    });
    userId = user._id.toString();
  });

  afterAll(async () => {
    if (!userId) return;
    await Payment.deleteMany({ userId });
    await Order.deleteMany({ userId });
    await User.deleteOne({ _id: userId });
  });

  it("allows only one of two simultaneous payments that would otherwise overpay", async () => {
    const order = await createOrder(userId, orderInputSchema.parse({
      customer: "Concurrent payment test",
      dueDate: "2030-01-01",
      lineItems: [{ description: "Settlement", quantity: 1, unitPrice: "1000.00" }],
    }));
    const payment = paymentInputSchema.parse({ amount: "600.00", paymentDate: "2030-01-01" });

    const results = await Promise.allSettled([
      recordPayment(userId, order.id, payment),
      recordPayment(userId, order.id, payment),
    ]);
    const succeeded = results.filter((result) => result.status === "fulfilled");
    const failed = results.filter((result) => result.status === "rejected");

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect((failed[0] as PromiseRejectedResult).reason).toBeInstanceOf(ApiError);
    expect(((failed[0] as PromiseRejectedResult).reason as ApiError).code).toBe("PAYMENT_EXCEEDS_BALANCE");

    const detail = await getOrder(userId, order.id);
    expect(detail.payments).toHaveLength(1);
    expect(detail.order.amountPaidCents).toBe(60_000);
    expect(detail.order.amountDueCents).toBe(40_000);
    expect(detail.order.status).toBe("partially_paid");
  }, 30_000);
});
