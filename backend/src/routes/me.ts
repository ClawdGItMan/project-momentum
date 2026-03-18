import { Hono } from "hono";
import { z } from "zod";

import { requireAuthenticatedUser } from "../lib/auth";
import { errorResponse, okResponse } from "../lib/http";
import { createSupabaseUserClient } from "../lib/supabase/client";
import type { AppBindings } from "../types";

const mePatchSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    missionLine: z.string().trim().max(160).nullable().optional(),
    city: z.string().trim().max(80).nullable().optional(),
    accountabilityStyle: z.enum(["friends", "squad-first", "mixed"]).optional(),
    defaultAudience: z.enum(["only-me", "friends", "squad"]).optional(),
    selectedSquadId: z.string().uuid().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
  });

export const meRouter = new Hono<AppBindings>();

meRouter.get("/me", async (c) => {
  const auth = await requireAuthenticatedUser(c);
  if (auth.response) return auth.response;

  const userClient = createSupabaseUserClient(c.get("env"), auth.accessToken);
  const { data, error } = await userClient
    .from("profile_overviews")
    .select("*")
    .eq("user_id", auth.user.id)
    .single();

  if (error) {
    return errorResponse(c, {
      status: 404,
      code: "profile_not_found",
      message: "No profile exists for the current user yet.",
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

  return okResponse(c, data);
});

meRouter.patch("/me", async (c) => {
  const auth = await requireAuthenticatedUser(c);
  if (auth.response) return auth.response;

  const json = await c.req.json().catch(() => null);
  const parsed = mePatchSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse(c, {
      status: 400,
      code: "invalid_profile_patch",
      message: "The profile update payload is invalid.",
      details: parsed.error.flatten(),
    });
  }

  const userClient = createSupabaseUserClient(c.get("env"), auth.accessToken);

  if (parsed.data.selectedSquadId) {
    const { data: membership, error: membershipError } = await userClient
      .from("squad_memberships")
      .select("id")
      .eq("squad_id", parsed.data.selectedSquadId)
      .eq("user_id", auth.user.id)
      .eq("state", "active")
      .maybeSingle();

    if (membershipError || !membership) {
      return errorResponse(c, {
        status: 409,
        code: "invalid_selected_squad",
        message: "The selected squad must already include the current user.",
      });
    }
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.display_name = parsed.data.name;
  if (parsed.data.missionLine !== undefined) {
    updates.mission_line = parsed.data.missionLine || null;
  }
  if (parsed.data.city !== undefined) updates.city = parsed.data.city || null;
  if (parsed.data.accountabilityStyle !== undefined) {
    updates.accountability_style = parsed.data.accountabilityStyle;
  }
  if (parsed.data.defaultAudience !== undefined) {
    updates.default_audience = parsed.data.defaultAudience;
  }
  if (parsed.data.selectedSquadId !== undefined) {
    updates.selected_squad_id = parsed.data.selectedSquadId;
  }

  const { error: updateError } = await userClient
    .from("profiles")
    .update(updates)
    .eq("user_id", auth.user.id);

  if (updateError) {
    return errorResponse(c, {
      status: 500,
      code: "profile_update_failed",
      message: "Unable to update the profile.",
      details:
        c.get("env").nodeEnv === "development"
          ? {
              code: updateError.code,
              details: updateError.details,
              hint: updateError.hint,
            }
          : undefined,
    });
  }

  const { data, error } = await userClient
    .from("profile_overviews")
    .select("*")
    .eq("user_id", auth.user.id)
    .single();

  if (error) {
    return errorResponse(c, {
      status: 500,
      code: "profile_refetch_failed",
      message: "The profile updated, but the refreshed view could not be loaded.",
    });
  }

  return okResponse(c, data);
});
