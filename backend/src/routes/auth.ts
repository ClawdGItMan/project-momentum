import { Hono } from "hono";
import { z } from "zod";

import { requireAuthenticatedUser } from "../lib/auth";
import { errorResponse, okResponse } from "../lib/http";
import { createSupabaseUserClient } from "../lib/supabase/client";
import type { AppBindings } from "../types";

const bootstrapSchema = z.object({
  name: z.string().trim().min(1).max(80),
  username: z.string().trim().min(3).max(30),
  missionLine: z.string().trim().max(160).default(""),
  city: z.string().trim().max(80).default(""),
  pillars: z.array(z.enum(["fitness", "mindset", "learning", "recovery"])).min(1).max(4),
  goals: z.array(z.string().trim().min(1).max(80)).max(5),
  accountabilityStyle: z.enum(["friends", "squad-first", "mixed"]),
  defaultAudience: z.enum(["only-me", "friends", "squad"]).default("friends"),
  selectedSquadId: z.string().uuid().nullable().optional(),
});

export const authRouter = new Hono<AppBindings>();

authRouter.post("/auth/bootstrap", async (c) => {
  const auth = await requireAuthenticatedUser(c);
  if (auth.response) return auth.response;

  const json = await c.req.json().catch(() => null);
  const parsed = bootstrapSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse(c, {
      status: 400,
      code: "invalid_bootstrap_payload",
      message: "The auth bootstrap payload is invalid.",
      details: parsed.error.flatten(),
    });
  }

  const userClient = createSupabaseUserClient(c.get("env"), auth.accessToken);
  const { data, error } = await userClient.rpc("complete_onboarding", {
    p_display_name: parsed.data.name,
    p_username: parsed.data.username,
    p_mission_line: parsed.data.missionLine,
    p_city: parsed.data.city || null,
    p_pillars: parsed.data.pillars,
    p_goals: parsed.data.goals,
    p_accountability_style: parsed.data.accountabilityStyle,
    p_default_audience: parsed.data.defaultAudience,
    p_selected_squad_id: parsed.data.selectedSquadId ?? null,
  });

  if (error) {
    const message = error.message.toLowerCase();
    const status =
      message.includes("username is already taken") || message.includes("selected squad")
        ? 409
        : 400;

    return errorResponse(c, {
      status,
      code: status === 409 ? "profile_conflict" : "profile_bootstrap_failed",
      message: error.message,
      details:
        c.get("env").nodeEnv === "development"
          ? {
              code: error.code,
              details: error.details,
              hint: error.hint,
            }
          : undefined,
    });
  }

  return okResponse(c, data, 201);
});
