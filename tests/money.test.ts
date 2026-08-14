import { describe, expect, it } from "vitest";
import { parseMoneyToCents } from "../src/lib/money";

describe("parseMoneyToCents", () => {
  it("parses whole and decimal dollar inputs without floating point arithmetic", () => {
    expect(parseMoneyToCents("1000")).toBe(100_000);
    expect(parseMoneyToCents("10.05")).toBe(1_005);
    expect(parseMoneyToCents(400)).toBe(40_000);
  });

  it("rejects fractions of a cent and malformed values", () => {
    expect(parseMoneyToCents("0.001")).toBeNull();
    expect(parseMoneyToCents("$10.00")).toBeNull();
    expect(parseMoneyToCents("1e3")).toBeNull();
  });
});
