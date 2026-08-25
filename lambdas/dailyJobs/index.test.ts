import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
}));

vi.mock("./log", () => ({
  log: {
    info: mocks.info,
    warn: vi.fn(),
    error: mocks.error,
  },
  store: {},
  als: {
    run: (_store: unknown, callback: () => unknown) => callback(),
  },
}));

vi.mock("./jobs", () => ({ dailyJobs: [] }));

import { getEasternDate, handler, runDailyJobs } from "./index";
import type { DailyJob } from "./types";

describe("Daily Jobs runner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("derives the Eastern date across daylight-saving boundaries", () => {
    expect(getEasternDate(new Date("2026-03-08T04:30:00.000Z"))).toBe("2026-03-07");
    expect(getEasternDate(new Date("2026-03-08T12:00:00.000Z"))).toBe("2026-03-08");
    expect(getEasternDate(new Date("2026-11-01T05:30:00.000Z"))).toBe("2026-11-01");
  });

  it("runs jobs sequentially and reports failures without stopping", async () => {
    const order: string[] = [];
    const jobs: DailyJob[] = [
      {
        id: "first",
        async run(context) {
          order.push(`first:${context.easternDate}`);
          return { processed: 2, succeeded: 1, failed: 0, skipped: 1 };
        },
      },
      {
        id: "broken",
        async run() {
          order.push("broken");
          throw new Error("database unavailable");
        },
      },
      {
        id: "last",
        async run() {
          order.push("last");
          return { processed: 1, succeeded: 1, failed: 0, skipped: 0 };
        },
      },
    ];

    const result = await runDailyJobs(
      { source: "manual", scheduledAt: "2026-08-24T12:00:00.000Z" },
      jobs,
      vi.fn(async () => ({}) as any)
    );

    expect(order).toEqual(["first:2026-08-24", "broken", "last"]);
    expect(result).toMatchObject({
      source: "manual",
      easternDate: "2026-08-24",
      processed: 4,
      succeeded: 2,
      failed: 1,
      skipped: 1,
    });
    expect(result.jobs).toEqual([
      { id: "first", processed: 2, succeeded: 1, failed: 0, skipped: 1 },
      { id: "broken", processed: 1, succeeded: 0, failed: 1, skipped: 0 },
      { id: "last", processed: 1, succeeded: 1, failed: 0, skipped: 0 },
    ]);
    expect(mocks.error).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: "broken" }),
      "Daily job failed"
    );
  });

  it.each([
    [null, "Daily Jobs event must be an object."],
    [{ source: "other", scheduledAt: "2026-08-24T12:00:00.000Z" }, "source"],
    [{ source: "scheduler" }, "scheduledAt"],
    [{ source: "scheduler", scheduledAt: "today" }, "Invalid Daily Jobs scheduledAt"],
  ])("rejects an unusable invocation event", async (event, message) => {
    await expect(runDailyJobs(event, [], vi.fn())).rejects.toThrow(message);
  });

  it("logs and rethrows fatal handler errors", async () => {
    await expect(handler({ source: "manual", scheduledAt: "invalid" })).rejects.toThrow(
      "Invalid Daily Jobs scheduledAt"
    );
    expect(mocks.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(Error) }),
      "Daily Jobs run could not start"
    );
  });
});
