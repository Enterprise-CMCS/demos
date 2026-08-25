import type { Logger } from "pino";
import type { Pool } from "pg";

export type DailyJobResult = {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
};

export type DailyJobContext = {
  scheduledAt: Date;
  easternDate: string;
  pool: Pool;
  logger: Pick<Logger, "info" | "warn" | "error">;
};

export interface DailyJob {
  id: string;
  run(context: DailyJobContext): Promise<DailyJobResult>;
}
