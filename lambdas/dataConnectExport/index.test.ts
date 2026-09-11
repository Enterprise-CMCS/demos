import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { Context, ScheduledEvent } from "aws-lambda";
import { Pool } from "pg";

const mocks = vi.hoisted(() => ({
  // Every mock appends to this so cross-module ordering can be asserted in one place.
  order: [] as string[],
  getDbPoolMock: vi.fn(),
  withSnapshotMock: vi.fn(),
  buildRelationSchemaMock: vi.fn(),
  writeRelationToFileMock: vi.fn(),
  uploadParquetMock: vi.fn(),
  uploadSuccessMarkerMock: vi.fn(),
  cleanupTmpMock: vi.fn(),
  reqIdChildMock: vi.fn(),
  logInfoMock: vi.fn(),
  logWarnMock: vi.fn(),
  logErrorMock: vi.fn(),
}));

// als.run must be neutralised or the handler body never runs under vitest.
vi.mock("./log", () => ({
  als: {
    run: (_store: unknown, fn: () => unknown) => fn(),
  },
  store: new Map<string, string>(),
  reqIdChild: (...args: unknown[]) => mocks.reqIdChildMock(...args),
  log: {
    info: (...args: unknown[]) => mocks.logInfoMock(...args),
    warn: (...args: unknown[]) => mocks.logWarnMock(...args),
    error: (...args: unknown[]) => mocks.logErrorMock(...args),
  },
}));

vi.mock("./database/pool", () => ({
  getDbPool: (...args: unknown[]) => mocks.getDbPoolMock(...args),
  dbSchema: "demos_app",
}));

vi.mock("./database/snapshot", () => ({
  withSnapshot: (...args: unknown[]) => mocks.withSnapshotMock(...args),
}));

vi.mock("./parquet/typeMap", () => ({
  buildRelationSchema: (...args: unknown[]) => mocks.buildRelationSchemaMock(...args),
}));

vi.mock("./parquet/writer", () => ({
  writeRelationToFile: (...args: unknown[]) => mocks.writeRelationToFileMock(...args),
}));

vi.mock("./services/s3", () => ({
  uploadParquet: (...args: unknown[]) => mocks.uploadParquetMock(...args),
  uploadSuccessMarker: (...args: unknown[]) => mocks.uploadSuccessMarkerMock(...args),
}));

// stagingPath is stubbed so expected paths do not depend on os.tmpdir(), which is a private
// /var/folders path on macOS and /tmp in Lambda.
vi.mock("./util/staging", () => ({
  stagingPath: (relation: string) => `/tmp/${relation}.parquet`,
  cleanupTmp: (...args: unknown[]) => mocks.cleanupTmpMock(...args),
}));

import { handler } from "./index";
import { EXPORT_DATASETS } from "./allowlist";

// allowlist.ts and util/keys.ts are deliberately not mocked. The real allowlist drives the
// loop and the real partitionKey produces the asserted keys, so a change to either shows up here.
const RELATIONS = Object.keys(EXPORT_DATASETS);
const LAST_RELATION = RELATIONS[RELATIONS.length - 1];
const RUN_TIME = new Date("2026-09-04T07:00:00.000Z");
// Distinct times catch code that substitutes runDate for snapshotTime.
const SNAPSHOT_TIME = new Date("2026-09-04T07:00:04.250Z");
const ROW_COUNT = 7;

// Distinct identities detect reads that escape the snapshot client.
const POOL = { tag: "pool" } as unknown as Pool;
const SNAPSHOT_CLIENT = { tag: "snapshot-client" };

const event = {} as ScheduledEvent;
const context = { awsRequestId: "req-123" } as unknown as Context;

const columnsFor = (relation: string) => EXPORT_DATASETS[relation as keyof typeof EXPORT_DATASETS];

describe("dataConnectExport handler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(RUN_TIME);
    mocks.order.length = 0;

    mocks.getDbPoolMock.mockReset();
    mocks.withSnapshotMock.mockReset();
    mocks.buildRelationSchemaMock.mockReset();
    mocks.writeRelationToFileMock.mockReset();
    mocks.uploadParquetMock.mockReset();
    mocks.uploadSuccessMarkerMock.mockReset();
    mocks.cleanupTmpMock.mockReset();
    mocks.reqIdChildMock.mockReset();
    mocks.logInfoMock.mockReset();
    mocks.logWarnMock.mockReset();
    mocks.logErrorMock.mockReset();

    mocks.getDbPoolMock.mockResolvedValue(POOL);
    mocks.withSnapshotMock.mockImplementation(
      async (
        _pool: unknown,
        relations: string[],
        fn: (client: unknown, snapshot: Date) => Promise<unknown>
      ) => {
        mocks.order.push(`open:${relations.join(",")}`);
        const result = await fn(SNAPSHOT_CLIENT, SNAPSHOT_TIME);
        mocks.order.push("commit");
        return result;
      }
    );
    mocks.buildRelationSchemaMock.mockResolvedValue({ columns: [] });
    mocks.writeRelationToFileMock.mockImplementation(async (_client: unknown, relation: string) => {
      mocks.order.push(`stage:${relation}`);
      return ROW_COUNT;
    });
    mocks.uploadParquetMock.mockImplementation(async (_localPath: string, key: string) => {
      mocks.order.push(`upload:${key}`);
    });
    mocks.uploadSuccessMarkerMock.mockImplementation(async () => {
      mocks.order.push("marker");
    });
    mocks.cleanupTmpMock.mockImplementation(async () => {
      mocks.order.push("cleanup");
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stages every relation before uploading any, then writes the marker last", async () => {
    await handler(event, context);

    // Commit before uploads so S3 latency does not hold the transaction open.
    expect(mocks.order).toEqual([
      `open:${RELATIONS.join(",")}`,
      ...RELATIONS.map((relation) => `stage:${relation}`),
      "commit",
      ...RELATIONS.map((relation) => `upload:${relation}/dt=2026-09-04/part-000.parquet`),
      "marker",
      "cleanup",
    ]);
  });

  it("opens one snapshot over every allowlisted relation", async () => {
    await handler(event, context);

    expect(mocks.withSnapshotMock).toHaveBeenCalledTimes(1);
    const [pool, relations] = mocks.withSnapshotMock.mock.calls[0];
    expect(pool).toBe(POOL);
    expect(relations).toEqual(RELATIONS);
  });

  it("reads every relation on the snapshot client rather than the pool", async () => {
    await handler(event, context);

    for (const [client] of mocks.buildRelationSchemaMock.mock.calls) {
      expect(client).toBe(SNAPSHOT_CLIENT);
    }
    for (const [client] of mocks.writeRelationToFileMock.mock.calls) {
      expect(client).toBe(SNAPSHOT_CLIENT);
    }
  });

  it("builds each relation schema from the allowlisted columns", async () => {
    await handler(event, context);

    expect(mocks.buildRelationSchemaMock).toHaveBeenCalledTimes(RELATIONS.length);
    RELATIONS.forEach((relation, index) => {
      const [, calledRelation, calledColumns] = mocks.buildRelationSchemaMock.mock.calls[index];
      expect(calledRelation).toBe(relation);
      expect(calledColumns).toEqual(columnsFor(relation));
    });
  });

  it("writes the success marker with the run date and every row count", async () => {
    await handler(event, context);

    expect(mocks.uploadSuccessMarkerMock).toHaveBeenCalledWith(
      RUN_TIME,
      RELATIONS.map((relation) => ({
        relation,
        localPath: `/tmp/${relation}.parquet`,
        rowCount: ROW_COUNT,
      })),
      SNAPSHOT_TIME
    );
  });

  it("tags the logger with the request id before doing any work", async () => {
    await handler(event, context);

    expect(mocks.reqIdChildMock).toHaveBeenCalledWith("req-123");
    // Ordering, not just the call. Every log line emitted before this runs is missing the
    // request id, so tagging after the first await would lose the connection attempt.
    expect(mocks.reqIdChildMock.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.getDbPoolMock.mock.invocationCallOrder[0]
    );
  });

  it("publishes nothing when any relation fails to stage", async () => {
    mocks.writeRelationToFileMock.mockImplementation(async (_client: unknown, relation: string) => {
      if (relation === LAST_RELATION) {
        throw new Error("duckdb copy failed");
      }
      mocks.order.push(`stage:${relation}`);
      return ROW_COUNT;
    });

    await expect(handler(event, context)).rejects.toThrow("duckdb copy failed");

    expect(mocks.uploadParquetMock).not.toHaveBeenCalled();
    expect(mocks.uploadSuccessMarkerMock).not.toHaveBeenCalled();
    expect(mocks.logErrorMock).toHaveBeenCalledWith(
      { error: "duckdb copy failed" },
      "data export failed."
    );
  });

  it("does not mark the run successful when an upload fails", async () => {
    mocks.uploadParquetMock.mockRejectedValueOnce(new Error("s3 access denied"));

    await expect(handler(event, context)).rejects.toThrow("s3 access denied");

    expect(mocks.uploadSuccessMarkerMock).not.toHaveBeenCalled();
  });

  it("always cleans up the staging directory", async () => {
    await handler(event, context);
    expect(mocks.cleanupTmpMock).toHaveBeenCalledTimes(1);

    mocks.writeRelationToFileMock.mockRejectedValue(new Error("boom"));
    await expect(handler(event, context)).rejects.toThrow("boom");
    expect(mocks.cleanupTmpMock).toHaveBeenCalledTimes(2);
  });
});
