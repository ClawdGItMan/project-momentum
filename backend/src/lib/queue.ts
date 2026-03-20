import { PgBoss, type Job } from "pg-boss";

import type { BackendEnv } from "../config/env";
import {
  handleProviderSyncJobs,
  handleProviderWebhookJobs,
} from "./providers/sync";
import type { ProviderQueueRuntime } from "./providers/types";

export const queueJobNames = {
  consistencyRecompute: "consistency.recompute",
  providerSync: "provider.sync",
  webhookProcess: "provider.webhook.process",
} as const;

export function createQueue(env: BackendEnv) {
  return new PgBoss({
    connectionString: env.databaseUrl,
    schema: env.queueSchema,
  });
}

function summarizeJobs(jobs: Job<object>[]) {
  return jobs.map((job) => {
    const data = (job.data ?? {}) as Record<string, unknown>;

    return {
      id: job.id,
      provider: typeof data.provider === "string" ? data.provider : undefined,
      userId: typeof data.userId === "string" ? data.userId : undefined,
      syncRunId: typeof data.syncRunId === "string" ? data.syncRunId : undefined,
      webhookEventId:
        typeof data.webhookEventId === "string" ? data.webhookEventId : undefined,
      mode: typeof data.mode === "string" ? data.mode : undefined,
      reason: typeof data.reason === "string" ? data.reason : undefined,
      eventType: typeof data.eventType === "string" ? data.eventType : undefined,
      sourceReference:
        typeof data.sourceReference === "string" ? data.sourceReference : undefined,
    };
  });
}

export async function registerDefaultWorkers(runtime: ProviderQueueRuntime) {
  await runtime.queue.createQueue(queueJobNames.consistencyRecompute);
  await runtime.queue.createQueue(queueJobNames.providerSync);
  await runtime.queue.createQueue(queueJobNames.webhookProcess);

  await runtime.queue.work(
    queueJobNames.consistencyRecompute,
    async (jobs: Job<object>[]) => {
      runtime.logger.info(
        {
          jobIds: jobs.map((job) => job.id),
          jobName: queueJobNames.consistencyRecompute,
        },
        "Consistency recompute job received.",
      );
    },
  );

  await runtime.queue.work(queueJobNames.providerSync, async (jobs: Job<object>[]) => {
    runtime.logger.info(
      {
        jobName: queueJobNames.providerSync,
        jobs: summarizeJobs(jobs),
      },
      "Provider sync jobs received.",
    );

    await handleProviderSyncJobs(runtime, jobs);
  });

  await runtime.queue.work(queueJobNames.webhookProcess, async (jobs: Job<object>[]) => {
    runtime.logger.info(
      {
        jobName: queueJobNames.webhookProcess,
        jobs: summarizeJobs(jobs),
      },
      "Provider webhook jobs received.",
    );

    await handleProviderWebhookJobs(runtime, jobs);
  });
}
