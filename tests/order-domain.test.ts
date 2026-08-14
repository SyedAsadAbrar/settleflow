import { describe, expect, it } from "vitest";
import {
  assertOrderEditable,
  calculateOrderTotalCents,
  deriveOrderStatus,
} from "../src/modules/orders/domain";

describe("calculateOrderTotalCents", () => {
  it("calculates a single line in integer cents", () => {
    expect(calculateOrderTotalCents([{ description: "Service", quantity: 2, unitPriceCents: 12_345 }])).toBe(24_690);
  });

  it("sums multiple line items", () => {
    expect(calculateOrderTotalCents([
      { description: "Implementation", quantity: 1, unitPriceCents: 90_000 },
      { description: "Support", quantity: 2, unitPriceCents: 5_000 },
    ])).toBe(100_000);
  });

  it("rejects invalid quantities and non-integer cents", () => {
    expect(() => calculateOrderTotalCents([{ description: "Bad", quantity: 0, unitPriceCents: 100 }])).toThrow();
    expect(() => calculateOrderTotalCents([{ description: "Bad", quantity: 1, unitPriceCents: 10.5 }])).toThrow();
  });
});

describe("deriveOrderStatus", () => {
  const now = new Date("2026-08-14T12:00:00.000Z");
  const future = new Date("2026-08-20T00:00:00.000Z");
  const past = new Date("2026-08-13T00:00:00.000Z");

  it("returns pending for an unpaid order before its due date", () => {
    expect(deriveOrderStatus(100_000, 0, future, now)).toBe("pending");
  });

  it("returns partially_paid for a partial payment before its due date", () => {
    expect(deriveOrderStatus(100_000, 40_000, future, now)).toBe("partially_paid");
  });

  it("returns paid when fully paid", () => {
    expect(deriveOrderStatus(100_000, 100_000, future, now)).toBe("paid");
  });

  it("returns overdue for unpaid and partially paid past-due orders", () => {
    expect(deriveOrderStatus(100_000, 0, past, now)).toBe("overdue");
    expect(deriveOrderStatus(100_000, 40_000, past, now)).toBe("overdue");
  });

  it("keeps a fully paid past-due order paid", () => {
    expect(deriveOrderStatus(100_000, 100_000, past, now)).toBe("paid");
  });

  it("does not mark an order overdue until the UTC due-date day has ended", () => {
    expect(deriveOrderStatus(100_000, 0, new Date("2026-08-14T00:00:00.000Z"), now)).toBe("pending");
  });
});

describe("order immutability", () => {
  it("allows edits before the first payment", () => {
    expect(() => assertOrderEditable(0)).not.toThrow();
  });

  it("rejects financial edits after the first payment", () => {
    expect(() => assertOrderEditable(1)).toThrow("ORDER_LOCKED");
  });
});
