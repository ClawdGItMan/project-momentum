import { registerDefaultWorkers } from "./lib/queue";
import { createRuntime } from "./runtime";

async function main() {
  const runtime = createRuntime();

  await runtime.queue.start();
  await registerDefaultWorkers(runtime.queue, runtime.logger);

  runtime.logger.info(
    {
      queueSchema: runtime.env.queueSchema,
    },
    "Project Momentum worker started.",
  );
}

void main();
