import { serve } from "@hono/node-server";

import { registerDefaultWorkers } from "./lib/queue";
import { createRuntime } from "./runtime";

async function main() {
  const runtime = createRuntime();

  await runtime.queue.start();
  await registerDefaultWorkers(runtime);

  serve(
    {
      fetch: runtime.app.fetch,
      port: runtime.env.port,
    },
    (info) => {
      runtime.logger.info(
        {
          port: info.port,
          family: info.family,
          address: info.address,
        },
        "Project Momentum backend listening.",
      );
    },
  );
}

void main();
