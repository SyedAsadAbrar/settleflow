import { createSession } from "@/lib/auth/session";
import { errorResponse, readJson } from "@/lib/http/api-error";
import { signupSchema } from "@/modules/users/schemas";
import { createUser } from "@/modules/users/service";

export async function POST(request: Request) {
  try {
    const input = signupSchema.parse(await readJson(request));
    const user = await createUser(input.email, input.password);
    await createSession(user.id);
    return Response.json({ data: { user } }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
