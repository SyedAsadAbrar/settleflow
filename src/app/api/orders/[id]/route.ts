import { requireUserId } from "@/lib/auth/session";
import { errorResponse, readJson } from "@/lib/http/api-error";
import { orderInputSchema } from "@/modules/orders/schemas";
import { deleteOrder, getOrder, updateOrder } from "@/modules/orders/service";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: Context) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    const data = await getOrder(userId, id);
    return Response.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    const input = orderInputSchema.parse(await readJson(request));
    const order = await updateOrder(userId, id, input);
    return Response.json({ data: { order } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    await deleteOrder(userId, id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
