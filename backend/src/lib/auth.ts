import type { Context } from "hono";
import type { User } from "@supabase/supabase-js";

import { errorResponse } from "./http";
import { getUserFromAccessToken } from "./supabase/client";
import type { AppBindings } from "../types";

function extractBearerToken(authorization?: string | null): string | null {
  if (!authorization) return null;
  const [scheme, token] = authorization.trim().split(/\s+/u);
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
}

export async function requireAuthenticatedUser(c: Context<AppBindings>): Promise<
  | {
      accessToken: string;
      user: User;
      response: null;
    }
  | {
      accessToken: null;
      user: null;
      response: Response;
    }
> {
  const accessToken = extractBearerToken(c.req.header("authorization"));
  if (!accessToken) {
    return {
      accessToken: null,
      user: null,
      response: errorResponse(c, {
        status: 401,
        code: "unauthorized",
        message: "A valid Bearer access token is required.",
      }),
    };
  }

  const user = await getUserFromAccessToken(c.get("env"), accessToken);
  if (!user) {
    return {
      accessToken: null,
      user: null,
      response: errorResponse(c, {
        status: 401,
        code: "unauthorized",
        message: "The supplied access token is invalid or expired.",
      }),
    };
  }

  c.set("userId", user.id);
  return { accessToken, user, response: null };
}
