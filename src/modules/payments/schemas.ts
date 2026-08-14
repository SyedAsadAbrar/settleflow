import { z } from "zod";
import { parseMoneyToCents } from "@/lib/money";

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
  paymentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date in YYYY-MM-DD format.")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }, "Enter a valid date."),
  note: z.string().trim().max(500).optional(),
});

export type ParsedPaymentInput = z.infer<typeof paymentInputSchema>;
