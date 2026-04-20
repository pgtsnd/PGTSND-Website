import { spawn } from "node:child_process";
import app from "./app";
import { logger } from "./lib/logger";
import { startReminderJob } from "./jobs/review-reminders";
import { migratePlaintextIntegrationConfigs } from "./jobs/encrypt-integration-configs";
import { startScheduledExportJob } from "./jobs/scheduled-invoice-exports";
import { startDormantTokenSummaryJob } from "./jobs/dormant-token-summary";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function applyDbSchemaIfRequested(): Promise<void> {
  const flag = process.env["RUN_DB_PUSH_ON_BOOT"];
  if (flag !== "true") {
    return;
  }

  if (!process.env["DATABASE_URL"]) {
    logger.error(
      "RUN_DB_PUSH_ON_BOOT=true but DATABASE_URL is not set; skipping schema sync.",
    );
    return;
  }

  logger.info("Applying database schema via drizzle-kit push --force");

  await new Promise<void>((resolve) => {
    const child = spawn(
      "pnpm",
      ["--filter", "@workspace/db", "run", "push-force"],
      {
        stdio: "inherit",
        env: process.env,
      },
    );

    child.on("exit", (code) => {
      if (code === 0) {
        logger.info("Database schema sync completed");
      } else {
        logger.error(
          { exitCode: code },
          "drizzle-kit push failed; continuing startup. Manual schema sync may be required.",
        );
      }
      resolve();
    });

    child.on("error", (err) => {
      logger.error(
        { err },
        "Failed to spawn drizzle-kit push; continuing startup.",
      );
      resolve();
    });
  });
}

async function main() {
  await applyDbSchemaIfRequested();

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
    startReminderJob();
    startScheduledExportJob();
    startDormantTokenSummaryJob();
    void migratePlaintextIntegrationConfigs();
  });
}

void main();
