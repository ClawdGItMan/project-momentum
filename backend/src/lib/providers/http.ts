import type { ProviderApiError } from "./types";

export async function readJsonResponse<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function throwUpstreamError(
  provider: string,
  operation: string,
  response: Response,
): Promise<never> {
  const payload = await readJsonResponse<Record<string, unknown>>(response);
  const error = new Error(
    `${provider} ${operation} failed with status ${response.status}.`,
  ) as ProviderApiError;
  error.status = response.status;
  error.code =
    typeof payload?.message === "string"
      ? payload.message
      : typeof payload?.error === "string"
        ? payload.error
        : undefined;
  throw error;
}
