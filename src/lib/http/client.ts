interface ErrorPayload {
  error?: {
    message?: string;
    details?: Record<string, string>;
  };
}

export interface ClientApiError {
  message: string;
  details: Record<string, string>;
}

export async function getApiError(response: Response): Promise<ClientApiError> {
  try {
    const payload = (await response.json()) as ErrorPayload;
    const details = payload.error?.details ?? {};
    return {
      message: details.request ?? payload.error?.message ?? "Something went wrong. Please try again.",
      details,
    };
  } catch {
    return { message: "Something went wrong. Please try again.", details: {} };
  }
}
