import { z } from "zod";
import { parseMoneyToCents } from "@/lib/money";
import { dateOnlySchema } from "@/lib/validation";
import { ORDER_STATUSES } from "@/types/order";

const moneySchema = z.union([z.string(), z.number()]).transform((value, context) => {
  const cents = parseMoneyToCents(value);
  if (cents === null) {
    context.addIssue({ code: "custom", message: "Enter a valid amount with no more than 2 decimal places." });
    return z.NEVER;
  }
  return cents;
});

const lineItemSchema = z.object({
  description: z.string().trim().min(1, "Description is required.").max(200),
  quantity: z.coerce.number().int("Quantity must be a whole number.").min(1, "Quantity must be at least 1."),
  unitPrice: moneySchema,
});

export const orderInputSchema = z.object({
  customer: z.string().trim().min(1, "Customer is required.").max(200),
  dueDate: dateOnlySchema,
  lineItems: z.array(lineItemSchema).min(1, "Add at least one line item.").max(100),
}).superRefine((order, context) => {
  const totalCents = order.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  if (!Number.isSafeInteger(totalCents)) {
    context.addIssue({
      code: "custom",
      path: ["lineItems"],
      message: "Order total exceeds the supported monetary range.",
    });
  }
});

export const orderStatusSchema = z.enum(ORDER_STATUSES);

export type ParsedOrderInput = z.infer<typeof orderInputSchema>;
