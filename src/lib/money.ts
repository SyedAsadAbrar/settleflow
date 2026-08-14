const MONEY_PATTERN = /^\d+(?:\.\d{1,2})?$/;

export function parseMoneyToCents(value: string | number): number | null {
  const normalized = typeof value === "number" ? String(value) : value.trim();
  if (!MONEY_PATTERN.test(normalized)) return null;

  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
