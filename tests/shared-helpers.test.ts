import { describe, expect, it } from "vitest";
import { dateOnlySchema } from "../src/lib/validation";
import { toPaymentView } from "../src/modules/payments/view";

describe("shared boundary helpers", () => {
  it("accepts only real ISO calendar dates", () => {
    expect(dateOnlySchema.safeParse("2030-02-28").success).toBe(true);
    expect(dateOnlySchema.safeParse("2030-02-30").success).toBe(false);
  });

  it("serializes payment records consistently", () => {
    expect(toPaymentView({
      _id: { toString: () => "payment-1" },
      orderId: { toString: () => "order-1" },
      amountCents: 12_345,
      paymentDate: new Date("2030-01-02T00:00:00.000Z"),
      note: "Bank transfer",
      createdAt: new Date("2030-01-02T12:00:00.000Z"),
    })).toEqual({
      id: "payment-1",
      orderId: "order-1",
      amountCents: 12_345,
      paymentDate: "2030-01-02",
      note: "Bank transfer",
      createdAt: "2030-01-02T12:00:00.000Z",
    });
  });
});
