import { createSession } from "@/lib/auth/session";
import { errorResponse, readJson } from "@/lib/http/api-error";
import { loginSchema } from "@/modules/users/schemas";
import { authenticateUser } from "@/modules/users/service";

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await readJson(request));
    const user = await authenticateUser(input.email, input.password);
    await createSession(user.id);
    return Response.json({ data: { user } });
  } catch (error) {
    return errorResponse(error);
  }
}
