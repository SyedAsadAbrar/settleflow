import { z } from "zod";
import { parseMoneyToCents } from "@/lib/money";
import { ORDER_STATUSES } from "@/types/order";

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date in YYYY-MM-DD format.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Enter a valid date.");

const moneySchema = z.union([z.string(), z.number()]).transform((value, context) => {
  const cents = parseMoneyToCents(value);
  if (cents === null) {
    context.addIssue({ code: "custom", message: "Enter a valid amount with no more than 2 decimal places." });
    return z.NEVER;
  }
  return cents;
});

export const lineItemSchema = z.object({
  description: z.string().trim().min(1, "Description is required.").max(200),
  quantity: z.coerce.number().int("Quantity must be a whole number.").min(1, "Quantity must be at least 1."),
  unitPrice: moneySchema,
});

export const orderInputSchema = z.object({
  customer: z.string().trim().min(1, "Customer is required.").max(200),
  dueDate: dateStringSchema,
  lineItems: z.array(lineItemSchema).min(1, "Add at least one line item.").max(100),
});

export const orderStatusSchema = z.enum(ORDER_STATUSES);

export type ParsedOrderInput = z.infer<typeof orderInputSchema>;
