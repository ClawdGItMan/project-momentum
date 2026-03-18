import type { Context } from "hono";

import type { AppBindings } from "../types";

type ApiStatus = 200 | 201 | 202 | 400 | 401 | 404 | 409 | 500 | 501;

export function errorResponse(
  c: Context<AppBindings>,
  input: {
    status: ApiStatus;
    code: string;
    message: string;
    details?: unknown;
  },
) {
  return c.json(
    {
      error: {
        code: input.code,
        message: input.message,
        requestId: c.get("requestId"),
        ...(input.details === undefined ? {} : { details: input.details }),
      },
    },
    { status: input.status },
  );
}

export function okResponse<T>(
  c: Context<AppBindings>,
  data: T,
  status: 200 | 201 | 202 = 200,
) {
  return c.json(
    {
      data,
      meta: {
        requestId: c.get("requestId"),
      },
    },
    { status },
  );
}
