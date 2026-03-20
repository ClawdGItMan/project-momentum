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

type OwnedSquadRow = {
  id: string;
  name: string;
  handle: string;
};

type SquadMembershipRow = {
  squad_id: string;
  user_id: string;
};

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

meRouter.delete("/me", async (c) => {
  const auth = await requireAuthenticatedUser(c);
  if (auth.response) return auth.response;

  const supabaseAdmin = c.get("supabaseAdmin");

  const { data: ownedSquads, error: ownedSquadsError } = await supabaseAdmin
    .from("squads")
    .select("id, name, handle")
    .eq("owner_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (ownedSquadsError) {
    return errorResponse(c, {
      status: 500,
      code: "account_delete_precheck_failed",
      message: "Unable to verify squad ownership before deleting the account.",
      details:
        c.get("env").nodeEnv === "development"
          ? {
              code: ownedSquadsError.code,
              details: ownedSquadsError.details,
              hint: ownedSquadsError.hint,
            }
          : undefined,
    });
  }

  const ownedSquadRows = (ownedSquads ?? []) as OwnedSquadRow[];
  const ownedSquadIds = ownedSquadRows.map((squad) => squad.id);

  let blockingSquads: Array<OwnedSquadRow & { otherActiveMemberCount: number }> = [];

  if (ownedSquadIds.length > 0) {
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from("squad_memberships")
      .select("squad_id, user_id")
      .eq("state", "active")
      .neq("user_id", auth.user.id)
      .in("squad_id", ownedSquadIds);

    if (membershipsError) {
      return errorResponse(c, {
        status: 500,
        code: "account_delete_precheck_failed",
        message: "Unable to inspect squad memberships before deleting the account.",
        details:
          c.get("env").nodeEnv === "development"
            ? {
                code: membershipsError.code,
                details: membershipsError.details,
                hint: membershipsError.hint,
              }
            : undefined,
      });
    }

    const membershipRows = (memberships ?? []) as SquadMembershipRow[];
    const activeCounts = new Map<string, number>();

    for (const membership of membershipRows) {
      activeCounts.set(
        membership.squad_id,
        (activeCounts.get(membership.squad_id) ?? 0) + 1,
      );
    }

    blockingSquads = ownedSquadRows
      .map((squad) => ({
        ...squad,
        otherActiveMemberCount: activeCounts.get(squad.id) ?? 0,
      }))
      .filter((squad) => squad.otherActiveMemberCount > 0);
  }

  if (blockingSquads.length > 0) {
    return errorResponse(c, {
      status: 409,
      code: "account_delete_blocked",
      message: "Transfer ownership of your active squads before deleting this account.",
      details: {
        blockingSquads,
      },
    });
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(auth.user.id);

  if (deleteError) {
    const deleteDetails = deleteError as {
      code?: string;
      details?: string;
      hint?: string;
    };

    c.get("logger").error(
      {
        requestId: c.get("requestId"),
        userId: auth.user.id,
        deleteError,
      },
      "Failed to delete authenticated user account.",
    );

    return errorResponse(c, {
      status: 500,
      code: "account_delete_failed",
      message: "Unable to delete the account.",
      details:
        c.get("env").nodeEnv === "development"
          ? {
              code: deleteDetails.code,
              details: deleteDetails.details,
              hint: deleteDetails.hint,
            }
          : undefined,
    });
  }

  return okResponse(c, {
    deleted: true,
  });
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
