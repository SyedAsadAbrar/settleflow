import { describe, expect, it } from "vitest";
import { orderInputSchema } from "../src/modules/orders/schemas";

describe("order input validation", () => {
  it("rejects a line-item total that exceeds the safe integer-cent range", () => {
    const result = orderInputSchema.safeParse({
      customer: "Large customer",
      dueDate: "2030-01-01",
      lineItems: [{ description: "Large amount", quantity: 2, unitPrice: "90071992547409.91" }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["lineItems"]);
      expect(result.error.issues[0]?.message).toBe("Order total exceeds the supported monetary range.");
    }
  });
});
