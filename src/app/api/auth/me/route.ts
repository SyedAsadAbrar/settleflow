import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/http/api-error";
import { getUserById } from "@/modules/users/service";

export async function GET() {
  try {
    const user = await getUserById(await requireUserId());
    return Response.json({ data: { user } });
  } catch (error) {
    return errorResponse(error);
  }
}
