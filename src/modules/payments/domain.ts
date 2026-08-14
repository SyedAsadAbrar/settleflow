export type PaymentValidationResult =
  | { ok: true }
  | { ok: false; code: "INVALID_PAYMENT_AMOUNT" | "ORDER_ALREADY_PAID" | "PAYMENT_EXCEEDS_BALANCE" };

export function validatePayment(
  amountCents: number,
  totalCents: number,
  amountPaidCents: number,
): PaymentValidationResult {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    return { ok: false, code: "INVALID_PAYMENT_AMOUNT" };
  }

  const remainingCents = totalCents - amountPaidCents;
  if (remainingCents <= 0) return { ok: false, code: "ORDER_ALREADY_PAID" };
  if (amountCents > remainingCents) return { ok: false, code: "PAYMENT_EXCEEDS_BALANCE" };
  return { ok: true };
}
