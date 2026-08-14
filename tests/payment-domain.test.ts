import { describe, expect, it } from "vitest";
import { validatePayment } from "../src/modules/payments/domain";

describe("validatePayment", () => {
  it("requires a positive integer number of cents", () => {
    expect(validatePayment(0, 100_000, 0)).toEqual({ ok: false, code: "INVALID_PAYMENT_AMOUNT" });
    expect(validatePayment(-1, 100_000, 0)).toEqual({ ok: false, code: "INVALID_PAYMENT_AMOUNT" });
    expect(validatePayment(1.5, 100_000, 0)).toEqual({ ok: false, code: "INVALID_PAYMENT_AMOUNT" });
  });

  it("accepts a partial payment", () => {
    expect(validatePayment(40_000, 100_000, 0)).toEqual({ ok: true });
  });

  it("accepts the exact remaining balance", () => {
    expect(validatePayment(60_000, 100_000, 40_000)).toEqual({ ok: true });
  });

  it("rejects one dollar above the balance", () => {
    expect(validatePayment(60_100, 100_000, 40_000)).toEqual({ ok: false, code: "PAYMENT_EXCEEDS_BALANCE" });
  });

  it("rejects another payment after full settlement", () => {
    expect(validatePayment(100, 100_000, 100_000)).toEqual({ ok: false, code: "ORDER_ALREADY_PAID" });
  });
});
