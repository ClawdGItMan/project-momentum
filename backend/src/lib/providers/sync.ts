import type { Job } from "pg-boss";

import {
  fetchStravaActivity,
  getStravaManualSyncStart,
  listStravaActivities,
  normalizeStravaActivityToSnapshot,
  normalizeStravaSourceReference,
  refreshStravaAccessToken,
  revokeStravaAccess,
  summarizeStravaCoverage,
} from "./strava";
import {
  fetchWhoopSleepById,
  fetchWhoopWorkoutById,
  getWhoopManualSyncStart,
  listWhoopRecoveries,
  listWhoopSleeps,
  listWhoopWorkouts,
  normalizeWhoopRecoveryToSnapshot,
  normalizeWhoopSleepToSnapshot,
  normalizeWhoopSourceReference,
  normalizeWhoopWorkoutToSnapshot,
  refreshWhoopAccessToken,
  revokeWhoopAccess,
  summarizeWhoopCoverage,
} from "./whoop";
import {
  createProviderSyncRun,
  createStoredProviderToken,
  deleteProviderSnapshotBySourceReference,
  disconnectProviderConnection,
  getProviderConnection,
  getProviderWebhookEvent,
  markProviderSyncRunStatus,
  markProviderWebhookEventStatus,
  openStoredProviderToken,
  upsertProviderConnection,
  upsertProviderSnapshot,
} from "./store";
import type {
  ManagedProvider,
  ProviderConnectionRow,
  ProviderQueueRuntime,
  ProviderSyncJobPayload,
  ProviderWebhookEventRow,
  ProviderWebhookJobPayload,
} from "./types";

function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 280);
  }
  return "Unknown provider sync error.";
}

function tokenExpiresSoon(tokenExpiresAt: string | null): boolean {
  if (!tokenExpiresAt) return false;
  return new Date(tokenExpiresAt).getTime() <= Date.now() + 1000 * 60 * 5;
}

async function refreshManagedAccessToken(
  runtime: ProviderQueueRuntime,
  connection: ProviderConnectionRow,
): Promise<{ accessToken: string; connection: ProviderConnectionRow }> {
  const accessToken = openStoredProviderToken({
    env: runtime.env,
    provider: connection.provider,
    kind: "access",
    raw: connection.encrypted_access_token,
    userId: connection.user_id,
  });

  const refreshToken = openStoredProviderToken({
    env: runtime.env,
    provider: connection.provider,
    kind: "refresh",
    raw: connection.encrypted_refresh_token,
    userId: connection.user_id,
  });

  if (accessToken && !tokenExpiresSoon(connection.token_expires_at)) {
    return { accessToken, connection };
  }

  if (!refreshToken) {
    throw new Error(`${connection.provider} access is missing a refresh token.`);
  }

  if (connection.provider === "strava") {
    const refreshed = await refreshStravaAccessToken({
      env: runtime.env,
      refreshToken,
    });
    const nextConnection = await upsertProviderConnection(runtime.supabaseAdmin, {
      userId: connection.user_id,
      provider: connection.provider,
      state: "syncing",
      connectedAt: connection.connected_at ?? new Date().toISOString(),
      providerAccountId: refreshed.providerAccountId || connection.provider_account_id,
      providerUsername: refreshed.providerUsername ?? connection.provider_username,
      scopes: refreshed.scopes,
      accessToken: createStoredProviderToken({
        env: runtime.env,
        provider: connection.provider,
        kind: "access",
        value: refreshed.accessToken,
        userId: connection.user_id,
      }),
      refreshToken: refreshed.refreshToken
        ? createStoredProviderToken({
            env: runtime.env,
            provider: connection.provider,
            kind: "refresh",
            value: refreshed.refreshToken,
            userId: connection.user_id,
          })
        : undefined,
      tokenExpiresAt: refreshed.tokenExpiresAt,
      metadata: refreshed.metadata,
    });

    return {
      accessToken: refreshed.accessToken,
      connection: nextConnection,
    };
  }

  const refreshed = await refreshWhoopAccessToken({
    env: runtime.env,
    refreshToken,
  });
  const nextConnection = await upsertProviderConnection(runtime.supabaseAdmin, {
    userId: connection.user_id,
    provider: connection.provider,
    state: "syncing",
    connectedAt: connection.connected_at ?? new Date().toISOString(),
    providerAccountId: refreshed.providerAccountId || connection.provider_account_id,
    providerUsername: refreshed.providerUsername ?? connection.provider_username,
    scopes: refreshed.scopes,
    accessToken: createStoredProviderToken({
      env: runtime.env,
      provider: connection.provider,
      kind: "access",
      value: refreshed.accessToken,
      userId: connection.user_id,
    }),
    refreshToken: refreshed.refreshToken
      ? createStoredProviderToken({
          env: runtime.env,
          provider: connection.provider,
          kind: "refresh",
          value: refreshed.refreshToken,
          userId: connection.user_id,
        })
      : undefined,
    tokenExpiresAt: refreshed.tokenExpiresAt,
    metadata: refreshed.metadata,
  });

  return {
    accessToken: refreshed.accessToken,
    connection: nextConnection,
  };
}

async function getConnectionByProviderAccountId(
  runtime: ProviderQueueRuntime,
  input: {
    provider: ManagedProvider;
    providerAccountId: string;
  },
): Promise<ProviderConnectionRow | null> {
  const { data, error } = await runtime.supabaseAdmin
    .from("provider_connections")
    .select("*")
    .eq("provider", input.provider)
    .eq("provider_account_id", input.providerAccountId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load ${input.provider} connection by provider account id: ${error.message}`);
  }

  return (data as ProviderConnectionRow | null) ?? null;
}

async function runStravaSync(
  runtime: ProviderQueueRuntime,
  input: {
    payload: ProviderSyncJobPayload;
    connection: ProviderConnectionRow;
    accessToken: string;
  },
): Promise<{ itemCount: number; coverage: unknown; syncCursor: string }> {
  let activities =
    input.payload.externalId != null
      ? [await fetchStravaActivity(input.accessToken, input.payload.externalId)]
      : await listStravaActivities({
          accessToken: input.accessToken,
          after: getStravaManualSyncStart(input.connection),
        });

  if (input.payload.sourceReference) {
    const expectedReference = input.payload.sourceReference;
    activities = activities.filter(
      (activity) => normalizeStravaSourceReference(activity.id) === expectedReference,
    );
  }

  for (const activity of activities) {
    await upsertProviderSnapshot(
      runtime.supabaseAdmin,
      normalizeStravaActivityToSnapshot({
        activity,
        connection: input.connection,
        syncRunId: input.payload.syncRunId,
      }),
    );
  }

  return {
    itemCount: activities.length,
    coverage: summarizeStravaCoverage(activities),
    syncCursor: new Date().toISOString(),
  };
}

async function runWhoopSync(
  runtime: ProviderQueueRuntime,
  input: {
    payload: ProviderSyncJobPayload;
    connection: ProviderConnectionRow;
    accessToken: string;
  },
): Promise<{ itemCount: number; coverage: unknown; syncCursor: string }> {
  const start = getWhoopManualSyncStart(input.connection);
  const end = new Date().toISOString();

  let workouts =
    input.payload.eventType === "workout.updated" && input.payload.externalId
      ? [await fetchWhoopWorkoutById(input.accessToken, input.payload.externalId)]
      : await listWhoopWorkouts({
          accessToken: input.accessToken,
          start,
          end,
        });

  let sleeps =
    input.payload.eventType === "sleep.updated" && input.payload.externalId
      ? [await fetchWhoopSleepById(input.accessToken, input.payload.externalId)]
      : await listWhoopSleeps({
          accessToken: input.accessToken,
          start,
          end,
        });

  let recoveries = await listWhoopRecoveries({
    accessToken: input.accessToken,
    start,
    end,
  });

  if (input.payload.eventType === "recovery.updated" && input.payload.externalId) {
    recoveries = recoveries.filter(
      (recovery) => recovery.sleep_id === input.payload.externalId,
    );
  }

  if (input.payload.sourceReference) {
    workouts = workouts.filter(
      (workout) => normalizeWhoopSourceReference("workout", workout.id) === input.payload.sourceReference,
    );
    sleeps = sleeps.filter(
      (sleep) => normalizeWhoopSourceReference("sleep", sleep.id) === input.payload.sourceReference,
    );
    recoveries = recoveries.filter(
      (recovery) =>
        normalizeWhoopSourceReference("recovery", recovery.sleep_id) ===
        input.payload.sourceReference,
    );
  }

  const sleepsById = new Map(sleeps.map((sleep) => [sleep.id, sleep]));

  for (const workout of workouts) {
    await upsertProviderSnapshot(
      runtime.supabaseAdmin,
      normalizeWhoopWorkoutToSnapshot({
        workout,
        connection: input.connection,
        syncRunId: input.payload.syncRunId,
      }),
    );
  }

  for (const sleep of sleeps) {
    await upsertProviderSnapshot(
      runtime.supabaseAdmin,
      normalizeWhoopSleepToSnapshot({
        sleep,
        connection: input.connection,
        syncRunId: input.payload.syncRunId,
      }),
    );
  }

  for (const recovery of recoveries) {
    await upsertProviderSnapshot(
      runtime.supabaseAdmin,
      normalizeWhoopRecoveryToSnapshot({
        recovery,
        connection: input.connection,
        syncRunId: input.payload.syncRunId,
        relatedSleep: sleepsById.get(recovery.sleep_id) ?? null,
      }),
    );
  }

  return {
    itemCount: workouts.length + sleeps.length + recoveries.length,
    coverage: summarizeWhoopCoverage({
      workouts,
      sleeps,
      recoveries,
    }),
    syncCursor: end,
  };
}

async function processProviderSyncJob(
  runtime: ProviderQueueRuntime,
  payload: ProviderSyncJobPayload,
): Promise<void> {
  await markProviderSyncRunStatus(runtime.supabaseAdmin, {
    syncRunId: payload.syncRunId,
    status: "running",
    metadata: {
      mode: payload.mode,
      reason: payload.reason ?? null,
      externalId: payload.externalId ?? null,
      eventType: payload.eventType ?? null,
    },
  });

  const connection = await getProviderConnection(
    runtime.supabaseAdmin,
    payload.userId,
    payload.provider,
  );

  if (!connection) {
    throw new Error(`No ${payload.provider} connection exists for the requested sync.`);
  }

  const { accessToken, connection: currentConnection } = await refreshManagedAccessToken(
    runtime,
    connection,
  );

  const result =
    payload.provider === "strava"
      ? await runStravaSync(runtime, {
          payload,
          connection: currentConnection,
          accessToken,
        })
      : await runWhoopSync(runtime, {
          payload,
          connection: currentConnection,
          accessToken,
        });

  await upsertProviderConnection(runtime.supabaseAdmin, {
    userId: currentConnection.user_id,
    provider: currentConnection.provider,
    state: "connected",
    connectedAt: currentConnection.connected_at ?? new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
    lastError: null,
    coverage: result.coverage,
    syncCursor: result.syncCursor,
  });

  await markProviderSyncRunStatus(runtime.supabaseAdmin, {
    syncRunId: payload.syncRunId,
    status: "succeeded",
    itemCount: result.itemCount,
    metadata: {
      coverage: result.coverage,
      syncCursor: result.syncCursor,
    },
  });
}

async function processStravaWebhook(
  runtime: ProviderQueueRuntime,
  event: ProviderWebhookEventRow,
): Promise<void> {
  const ownerId = String(event.payload.owner_id ?? "");
  const objectId = String(event.payload.object_id ?? "");
  const objectType = String(event.payload.object_type ?? "");
  const aspectType = String(event.payload.aspect_type ?? "");
  const authorized = (event.payload.updates as Record<string, unknown> | undefined)?.authorized;

  if (!ownerId) {
    await markProviderWebhookEventStatus(runtime.supabaseAdmin, {
      webhookEventId: event.id,
      status: "rejected",
      errorMessage: "Strava webhook did not include owner_id.",
    });
    return;
  }

  const connection = await getConnectionByProviderAccountId(runtime, {
    provider: "strava",
    providerAccountId: ownerId,
  });

  if (!connection) {
    await markProviderWebhookEventStatus(runtime.supabaseAdmin, {
      webhookEventId: event.id,
      status: "processed",
      errorMessage: "No matching Strava connection found for webhook owner.",
    });
    return;
  }

  if (objectType === "athlete" && (authorized === false || authorized === "false")) {
    await disconnectProviderConnection(runtime.supabaseAdmin, {
      userId: connection.user_id,
      provider: "strava",
      metadata: {
        disconnectedByWebhookAt: new Date().toISOString(),
      },
    });
    await markProviderWebhookEventStatus(runtime.supabaseAdmin, {
      webhookEventId: event.id,
      status: "processed",
    });
    return;
  }

  if (objectType !== "activity" || !objectId) {
    await markProviderWebhookEventStatus(runtime.supabaseAdmin, {
      webhookEventId: event.id,
      status: "processed",
      errorMessage: "Strava webhook did not require activity processing.",
    });
    return;
  }

  if (aspectType === "delete") {
    await deleteProviderSnapshotBySourceReference(runtime.supabaseAdmin, {
      userId: connection.user_id,
      provider: "strava",
      sourceReference: normalizeStravaSourceReference(objectId),
    });
    await markProviderWebhookEventStatus(runtime.supabaseAdmin, {
      webhookEventId: event.id,
      status: "processed",
    });
    return;
  }

  const syncRun = await createProviderSyncRun(runtime.supabaseAdmin, {
    userId: connection.user_id,
    provider: "strava",
    metadata: {
      trigger: "webhook",
      webhookEventId: event.id,
      externalId: objectId,
      eventType: event.event_type,
    },
  });

  await runtime.queue.send("provider.sync", {
    provider: "strava",
    userId: connection.user_id,
    syncRunId: syncRun.id,
    mode: "webhook",
    reason: "strava_webhook",
    externalId: objectId,
    sourceReference: normalizeStravaSourceReference(objectId),
    eventType: event.event_type,
  } satisfies ProviderSyncJobPayload);

  await markProviderWebhookEventStatus(runtime.supabaseAdmin, {
    webhookEventId: event.id,
    status: "processed",
    syncRunId: syncRun.id,
  });
}

async function processWhoopWebhook(
  runtime: ProviderQueueRuntime,
  event: ProviderWebhookEventRow,
): Promise<void> {
  const userId = String(event.payload.user_id ?? "");
  const externalId = String(event.payload.id ?? "");
  const eventType = String(event.payload.type ?? "");

  if (!userId) {
    await markProviderWebhookEventStatus(runtime.supabaseAdmin, {
      webhookEventId: event.id,
      status: "rejected",
      errorMessage: "WHOOP webhook did not include user_id.",
    });
    return;
  }

  const connection = await getConnectionByProviderAccountId(runtime, {
    provider: "whoop",
    providerAccountId: userId,
  });

  if (!connection) {
    await markProviderWebhookEventStatus(runtime.supabaseAdmin, {
      webhookEventId: event.id,
      status: "processed",
      errorMessage: "No matching WHOOP connection found for webhook user.",
    });
    return;
  }

  if (eventType === "workout.deleted" && externalId) {
    await deleteProviderSnapshotBySourceReference(runtime.supabaseAdmin, {
      userId: connection.user_id,
      provider: "whoop",
      sourceReference: normalizeWhoopSourceReference("workout", externalId),
    });
    await markProviderWebhookEventStatus(runtime.supabaseAdmin, {
      webhookEventId: event.id,
      status: "processed",
    });
    return;
  }

  if (eventType === "sleep.deleted" && externalId) {
    await deleteProviderSnapshotBySourceReference(runtime.supabaseAdmin, {
      userId: connection.user_id,
      provider: "whoop",
      sourceReference: normalizeWhoopSourceReference("sleep", externalId),
    });
    await deleteProviderSnapshotBySourceReference(runtime.supabaseAdmin, {
      userId: connection.user_id,
      provider: "whoop",
      sourceReference: normalizeWhoopSourceReference("recovery", externalId),
    });
    await markProviderWebhookEventStatus(runtime.supabaseAdmin, {
      webhookEventId: event.id,
      status: "processed",
    });
    return;
  }

  if (eventType === "recovery.deleted" && externalId) {
    await deleteProviderSnapshotBySourceReference(runtime.supabaseAdmin, {
      userId: connection.user_id,
      provider: "whoop",
      sourceReference: normalizeWhoopSourceReference("recovery", externalId),
    });
    await markProviderWebhookEventStatus(runtime.supabaseAdmin, {
      webhookEventId: event.id,
      status: "processed",
    });
    return;
  }

  const syncRun = await createProviderSyncRun(runtime.supabaseAdmin, {
    userId: connection.user_id,
    provider: "whoop",
    metadata: {
      trigger: "webhook",
      webhookEventId: event.id,
      externalId,
      eventType,
    },
  });

  await runtime.queue.send("provider.sync", {
    provider: "whoop",
    userId: connection.user_id,
    syncRunId: syncRun.id,
    mode: "webhook",
    reason: "whoop_webhook",
    externalId: externalId || null,
    sourceReference:
      eventType.startsWith("workout.")
        ? normalizeWhoopSourceReference("workout", externalId)
        : eventType.startsWith("sleep.")
          ? normalizeWhoopSourceReference("sleep", externalId)
          : eventType.startsWith("recovery.")
            ? normalizeWhoopSourceReference("recovery", externalId)
            : null,
    eventType,
  } satisfies ProviderSyncJobPayload);

  await markProviderWebhookEventStatus(runtime.supabaseAdmin, {
    webhookEventId: event.id,
    status: "processed",
    syncRunId: syncRun.id,
  });
}

async function processWebhookEventJob(
  runtime: ProviderQueueRuntime,
  payload: ProviderWebhookJobPayload,
): Promise<void> {
  const event = await getProviderWebhookEvent(runtime.supabaseAdmin, payload.webhookEventId);

  if (!event) {
    runtime.logger.warn(
      {
        provider: payload.provider,
        webhookEventId: payload.webhookEventId,
      },
      "Provider webhook event not found during processing.",
    );
    return;
  }

  if (payload.provider === "strava") {
    await processStravaWebhook(runtime, event);
    return;
  }

  await processWhoopWebhook(runtime, event);
}

export async function handleProviderSyncJobs(
  runtime: ProviderQueueRuntime,
  jobs: Job<object>[],
): Promise<void> {
  for (const job of jobs) {
    const payload = job.data as ProviderSyncJobPayload;

    try {
      await processProviderSyncJob(runtime, payload);
      runtime.logger.info(
        {
          jobId: job.id,
          jobName: "provider.sync",
          provider: payload.provider,
          userId: payload.userId,
          syncRunId: payload.syncRunId,
          mode: payload.mode,
        },
        "Provider sync job completed.",
      );
    } catch (error) {
      const message = sanitizeErrorMessage(error);
      await markProviderSyncRunStatus(runtime.supabaseAdmin, {
        syncRunId: payload.syncRunId,
        status: "failed",
        errorMessage: message,
      });
      await upsertProviderConnection(runtime.supabaseAdmin, {
        userId: payload.userId,
        provider: payload.provider,
        state: "error",
        lastError: message,
      });
      runtime.logger.error(
        {
          jobId: job.id,
          jobName: "provider.sync",
          provider: payload.provider,
          userId: payload.userId,
          syncRunId: payload.syncRunId,
          error: message,
        },
        "Provider sync job failed.",
      );
      throw error;
    }
  }
}

export async function handleProviderWebhookJobs(
  runtime: ProviderQueueRuntime,
  jobs: Job<object>[],
): Promise<void> {
  for (const job of jobs) {
    const payload = job.data as ProviderWebhookJobPayload;

    try {
      await processWebhookEventJob(runtime, payload);
      runtime.logger.info(
        {
          jobId: job.id,
          jobName: "provider.webhook.process",
          provider: payload.provider,
          webhookEventId: payload.webhookEventId,
        },
        "Provider webhook job completed.",
      );
    } catch (error) {
      const message = sanitizeErrorMessage(error);
      await markProviderWebhookEventStatus(runtime.supabaseAdmin, {
        webhookEventId: payload.webhookEventId,
        status: "failed",
        errorMessage: message,
      });
      runtime.logger.error(
        {
          jobId: job.id,
          jobName: "provider.webhook.process",
          provider: payload.provider,
          webhookEventId: payload.webhookEventId,
          error: message,
        },
        "Provider webhook job failed.",
      );
      throw error;
    }
  }
}

export async function enqueueProviderSync(
  runtime: ProviderQueueRuntime,
  payload: ProviderSyncJobPayload,
): Promise<void> {
  await runtime.queue.send("provider.sync", payload);
}

export async function enqueueProviderWebhookProcessing(
  runtime: ProviderQueueRuntime,
  payload: ProviderWebhookJobPayload,
): Promise<void> {
  await runtime.queue.send("provider.webhook.process", payload);
}

export async function disconnectManagedProvider(
  runtime: ProviderQueueRuntime,
  connection: ProviderConnectionRow,
): Promise<void> {
  const accessToken = openStoredProviderToken({
    env: runtime.env,
    provider: connection.provider,
    kind: "access",
    raw: connection.encrypted_access_token,
    userId: connection.user_id,
  });

  if (accessToken) {
    try {
      if (connection.provider === "strava") {
        await revokeStravaAccess({ accessToken });
      } else {
        await revokeWhoopAccess(accessToken);
      }
    } catch (error) {
      runtime.logger.warn(
        {
          provider: connection.provider,
          userId: connection.user_id,
          error: sanitizeErrorMessage(error),
        },
        "Provider revoke call failed; disconnecting locally anyway.",
      );
    }
  }

  await disconnectProviderConnection(runtime.supabaseAdmin, {
    userId: connection.user_id,
    provider: connection.provider,
    metadata: {
      disconnectedAt: new Date().toISOString(),
    },
  });
}
