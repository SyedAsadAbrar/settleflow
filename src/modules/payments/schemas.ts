import { z } from "zod";
import { parseMoneyToCents } from "@/lib/money";
import { dateOnlySchema } from "@/lib/validation";

const amountSchema = z.union([z.string(), z.number()]).transform((value, context) => {
  const cents = parseMoneyToCents(value);
  if (cents === null || cents <= 0) {
    context.addIssue({ code: "custom", message: "Amount must be greater than zero with no more than 2 decimal places." });
    return z.NEVER;
  }
  return cents;
});

export const paymentInputSchema = z.object({
  amount: amountSchema,
  paymentDate: dateOnlySchema,
  note: z.string().trim().max(500).optional(),
});

export type ParsedPaymentInput = z.infer<typeof paymentInputSchema>;
