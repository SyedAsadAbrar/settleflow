import { clearSession } from "@/lib/auth/session";
import { errorResponse } from "@/lib/http/api-error";

export async function POST() {
  try {
    await clearSession();
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
