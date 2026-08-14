import { requireUserId } from "@/lib/auth/session";
import { errorResponse, readJson } from "@/lib/http/api-error";
import { orderInputSchema, orderStatusSchema } from "@/modules/orders/schemas";
import { createOrder, listOrders } from "@/modules/orders/service";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const rawStatus = new URL(request.url).searchParams.get("status");
    const status = rawStatus ? orderStatusSchema.parse(rawStatus) : undefined;
    const orders = await listOrders(userId, status);
    return Response.json({ data: { orders } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const input = orderInputSchema.parse(await readJson(request));
    const order = await createOrder(userId, input);
    return Response.json({ data: { order } }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
