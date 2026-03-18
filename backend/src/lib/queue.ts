import { PgBoss, type Job } from "pg-boss";
import type { Logger } from "pino";

import type { BackendEnv } from "../config/env";

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

export async function registerDefaultWorkers(queue: PgBoss, logger: Logger) {
  await queue.createQueue(queueJobNames.consistencyRecompute);
  await queue.createQueue(queueJobNames.providerSync);
  await queue.createQueue(queueJobNames.webhookProcess);

  await queue.work(queueJobNames.consistencyRecompute, async (jobs: Job<object>[]) => {
    logger.info(
      {
        jobIds: jobs.map((job) => job.id),
        jobName: queueJobNames.consistencyRecompute,
        payloads: jobs.map((job) => job.data),
      },
      "Consistency recompute job received.",
    );
  });

  await queue.work(queueJobNames.providerSync, async (jobs: Job<object>[]) => {
    logger.info(
      {
        jobIds: jobs.map((job) => job.id),
        jobName: queueJobNames.providerSync,
        payloads: jobs.map((job) => job.data),
      },
      "Provider sync job received.",
    );
  });

  await queue.work(queueJobNames.webhookProcess, async (jobs: Job<object>[]) => {
    logger.info(
      {
        jobIds: jobs.map((job) => job.id),
        jobName: queueJobNames.webhookProcess,
        payloads: jobs.map((job) => job.data),
      },
      "Webhook processing job received.",
    );
  });
}
