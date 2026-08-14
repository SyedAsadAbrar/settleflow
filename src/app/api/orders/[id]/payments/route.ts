import { requireUserId } from "@/lib/auth/session";
import { errorResponse, readJson } from "@/lib/http/api-error";
import { getOrder } from "@/modules/orders/service";
import { paymentInputSchema } from "@/modules/payments/schemas";
import { recordPayment } from "@/modules/payments/service";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: Context) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    const { payments } = await getOrder(userId, id);
    return Response.json({ data: { payments } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    const input = paymentInputSchema.parse(await readJson(request));
    const paymentResult = await recordPayment(userId, id, input);
    return Response.json({ data: paymentResult }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
