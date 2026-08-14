import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ZodError) {
    const details: Record<string, string> = {};
    for (const issue of error.issues) {
      const field = issue.path.join(".") || "request";
      details[field] ??= issue.message;
    }
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request.", details } },
      { status: 400 },
    );
  }

  if (error instanceof ApiError) {
    return Response.json(
      { error: { code: error.code, message: error.message, ...error.details } },
      { status: error.status },
    );
  }

  console.error("Unhandled API error", error);
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } },
    { status: 500 },
  );
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
}
