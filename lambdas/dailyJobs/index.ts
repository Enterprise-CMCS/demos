import type { Pool } from "pg";

import { getDbPool } from "./db";
import { dailyJobs } from "./jobs";
import { als, log, store } from "./log";
import type { DailyJob, DailyJobResult } from "./types";

export type DailyJobsEvent = {
  source: "scheduler" | "manual";
  scheduledAt: string;
};

export type DailyJobsRunResult = DailyJobResult & {
  source: DailyJobsEvent["source"];
  scheduledAt: string;
  easternDate: string;
  jobs: Array<DailyJobResult & { id: string }>;
};

function parseEvent(event: unknown): { event: DailyJobsEvent; scheduledAt: Date } {
  if (typeof event !== "object" || event === null) {
    throw new Error("Daily Jobs event must be an object.");
  }

  const candidate = event as Partial<DailyJobsEvent>;
  if (candidate.source !== "scheduler" && candidate.source !== "manual") {
    throw new Error("Daily Jobs event source must be 'scheduler' or 'manual'.");
  }
  if (typeof candidate.scheduledAt !== "string") {
    throw new Error("Daily Jobs event scheduledAt must be an ISO timestamp.");
  }

  const scheduledAt = new Date(candidate.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error(`Invalid Daily Jobs scheduledAt timestamp: ${candidate.scheduledAt}`);
  }

  return {
    event: {
      source: candidate.source,
      scheduledAt: candidate.scheduledAt,
    },
    scheduledAt,
  };
}

export function getEasternDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  const year = value("year");
  const month = value("month");
  const day = value("day");

  if (!year || !month || !day) {
    throw new Error(`Unable to calculate Eastern date for ${date.toISOString()}`);
  }

  return `${year}-${month}-${day}`;
}

export async function runDailyJobs(
  input: unknown,
  registeredJobs: DailyJob[] = dailyJobs,
  poolFactory: () => Promise<Pool> = getDbPool
): Promise<DailyJobsRunResult> {
  const { event, scheduledAt } = parseEvent(input);
  const easternDate = getEasternDate(scheduledAt);
  const pool = await poolFactory();
  const results: DailyJobsRunResult["jobs"] = [];

  log.info(
    { source: event.source, scheduledAt: event.scheduledAt, easternDate },
    "Daily Jobs run started"
  );

  for (const job of registeredJobs) {
    try {
      const result = await job.run({ scheduledAt, easternDate, pool, logger: log });
      results.push({ id: job.id, ...result });
    } catch (error) {
      const result = { processed: 1, succeeded: 0, failed: 1, skipped: 0 };
      results.push({ id: job.id, ...result });
      log.error({ error, jobId: job.id, easternDate }, "Daily job failed");
    }
  }

  const totals = results.reduce<DailyJobResult>(
    (total, result) => ({
      processed: total.processed + result.processed,
      succeeded: total.succeeded + result.succeeded,
      failed: total.failed + result.failed,
      skipped: total.skipped + result.skipped,
    }),
    { processed: 0, succeeded: 0, failed: 0, skipped: 0 }
  );
  const result = {
    source: event.source,
    scheduledAt: scheduledAt.toISOString(),
    easternDate,
    jobs: results,
    ...totals,
  };

  log.info(result, "Daily Jobs run completed");
  return result;
}

export const handler = async (event: unknown): Promise<DailyJobsRunResult> =>
  als.run(store, async () => {
    try {
      return await runDailyJobs(event);
    } catch (error) {
      log.error({ error }, "Daily Jobs run could not start");
      throw error;
    }
  });
