import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { Context, ScheduledEvent } from "aws-lambda";
import { Pool } from "pg";

const mocks = vi.hoisted(() => ({
  // Every mock appends to this so cross-module ordering can be asserted in one place.
  order: [] as string[],
  getDbPoolMock: vi.fn(),
  withSnapshotMock: vi.fn(),
  withDuckDBConnectionMock: vi.fn(),
  writeRelationToFileMock: vi.fn(),
  uploadParquetMock: vi.fn(),
  uploadSuccessMarkerMock: vi.fn(),
  removeStagedFileMock: vi.fn(),
  cleanupTmpMock: vi.fn(),
  reqIdChildMock: vi.fn(),
  logInfoMock: vi.fn(),
  logWarnMock: vi.fn(),
  logErrorMock: vi.fn(),
}));

type LogModule = typeof import("./log");

// als.run must be neutralised or the handler body never runs under vitest. Only the members the
// handler calls are stubbed, so the casts stand in for the rest of AsyncLocalStorage and pino.
vi.mock(import("./log"), () => ({
  als: {
    run: (_store: unknown, fn: () => unknown) => fn(),
  } as unknown as LogModule["als"],
  store: new Map(),
  reqIdChild: (...args: unknown[]) => mocks.reqIdChildMock(...args),
  log: {
    info: (...args: unknown[]) => mocks.logInfoMock(...args),
    warn: (...args: unknown[]) => mocks.logWarnMock(...args),
    error: (...args: unknown[]) => mocks.logErrorMock(...args),
  } as unknown as LogModule["log"],
}));

vi.mock(import("./database/pool"), () => ({
  getDbPool: (...args: unknown[]) => mocks.getDbPoolMock(...args),
  dbSchema: "demos_app" as const,
}));

vi.mock(import("./database/snapshot"), () => ({
  withSnapshot: (...args: unknown[]) => mocks.withSnapshotMock(...args),
}));

vi.mock(import("./parquet/duckdb"), () => ({
  withDuckDBConnection: (...args: unknown[]) => mocks.withDuckDBConnectionMock(...args),
}));

vi.mock(import("./parquet/writer"), () => ({
  writeRelationToFile: (...args: unknown[]) => mocks.writeRelationToFileMock(...args),
}));

vi.mock(import("./services/s3"), () => ({
  uploadParquet: (...args: unknown[]) => mocks.uploadParquetMock(...args),
  uploadSuccessMarker: (...args: unknown[]) => mocks.uploadSuccessMarkerMock(...args),
}));

// stagingPath is stubbed so expected paths do not depend on os.tmpdir(), which is a private
// /var/folders path on macOS and /tmp in Lambda.
vi.mock(import("./util/staging"), () => ({
  stagingPath: (relation: string) => `/tmp/${relation}.parquet`,
  removeStagedFile: (...args: unknown[]) => mocks.removeStagedFileMock(...args),
  cleanupTmp: (...args: unknown[]) => mocks.cleanupTmpMock(...args),
}));

import { handler, snapshotTables } from "./index";
import type { ExportViewDefinition } from "./types";
import { EXPORT_VIEWS } from "./views";

// views.ts and util/keys.ts are deliberately not mocked. The real views drive the loop and
// the real partitionKey produces the asserted keys, so a change to either shows up here.
const RELATIONS = Object.keys(EXPORT_VIEWS);
const LOCKED_TABLES = [...new Set(EXPORT_VIEWS.demonstration_reporting.baseTables)].sort();
const RUN_TIME = new Date("2026-09-04T07:00:00.000Z");
// Later than RUN_TIME, as it is on a real run once the snapshot has waited on its lock.
const SNAPSHOT_TIME = new Date("2026-09-04T07:00:04.250Z");
const ROW_COUNT = 7;

// Distinct identities catch reads outside the snapshot or conversions outside DuckDB.
const POOL = { tag: "pool" } as unknown as Pool;
const SNAPSHOT_CLIENT = { tag: "snapshot-client" };
const DUCKDB_CONNECTION = { tag: "duckdb-connection" };

const event = {} as ScheduledEvent;
const context = { awsRequestId: "req-123" } as unknown as Context;

const definitionFor = (relation: string) =>
  EXPORT_VIEWS[relation as keyof typeof EXPORT_VIEWS];

const viewReading = (baseTables: string[]): ExportViewDefinition => ({
  query: "SELECT 1 AS id",
  orderBy: ["id"],
  baseTables,
  schema: { columns: [{ name: "id", duckdbType: "INTEGER" }] },
});

describe("snapshotTables", () => {
  it("locks the sorted, deduplicated union of physical source tables, never view names", () => {
    expect(snapshotTables({
      second_view: viewReading(["state", "demonstration", "person"]),
      first_view: viewReading(["person", "amendment", "state"]),
    })).toEqual(["amendment", "demonstration", "person", "state"]);
  });
});

describe("dataConnectExport handler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(RUN_TIME);
    mocks.order.length = 0;

    mocks.getDbPoolMock.mockReset();
    mocks.withSnapshotMock.mockReset();
    mocks.withDuckDBConnectionMock.mockReset();
    mocks.writeRelationToFileMock.mockReset();
    mocks.uploadParquetMock.mockReset();
    mocks.uploadSuccessMarkerMock.mockReset();
    mocks.removeStagedFileMock.mockReset();
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
        fn: (client: unknown) => Promise<unknown>
      ) => {
        mocks.order.push(`open:${relations.join(",")}`);
        await fn(SNAPSHOT_CLIENT);
        mocks.order.push("commit");
        return SNAPSHOT_TIME;
      }
    );
    mocks.withDuckDBConnectionMock.mockImplementation(
      async (fn: (connection: unknown) => Promise<unknown>) => {
        mocks.order.push("duckdb:open");
        try {
          return await fn(DUCKDB_CONNECTION);
        } finally {
          mocks.order.push("duckdb:close");
        }
      }
    );
    mocks.writeRelationToFileMock.mockImplementation(
      async (
        _client: unknown,
        _duckdb: unknown,
        relation: string
      ) => {
        mocks.order.push(`convert:${relation}`);
        return ROW_COUNT;
      }
    );
    mocks.uploadParquetMock.mockImplementation(async (_localPath: string, key: string) => {
      mocks.order.push(`upload:${key}`);
    });
    mocks.uploadSuccessMarkerMock.mockImplementation(async () => {
      mocks.order.push("marker");
    });
    mocks.cleanupTmpMock.mockImplementation(async () => {
      mocks.order.push("cleanup");
    });
    mocks.removeStagedFileMock.mockImplementation(async (localPath: string) => {
      mocks.order.push(`remove:${localPath}`);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("converts, uploads and removes each relation before committing and marking the run", async () => {
    await handler(event, context);

    expect(mocks.order).toEqual([
      "duckdb:open",
      `open:${LOCKED_TABLES.join(",")}`,
      ...RELATIONS.flatMap((relation) => [
        `convert:${relation}`,
        `upload:${relation}/dt=2026-09-04/part-000.parquet`,
        `remove:/tmp/${relation}.parquet`,
      ]),
      "commit",
      "marker",
      "duckdb:close",
      "cleanup",
    ]);
  });

  it("opens one snapshot locking every physical table the views read", async () => {
    await handler(event, context);

    expect(mocks.withSnapshotMock).toHaveBeenCalledTimes(1);
    const [pool, tables] = mocks.withSnapshotMock.mock.calls[0];
    expect(pool).toBe(POOL);
    expect(tables).toEqual(LOCKED_TABLES);
    expect(tables).not.toContain("demonstration_reporting");
  });

  it("uses the snapshot client and the invocation's DuckDB connection for every relation", async () => {
    await handler(event, context);

    expect(mocks.withDuckDBConnectionMock).toHaveBeenCalledTimes(1);
    for (const [client, duckdb] of mocks.writeRelationToFileMock.mock.calls) {
      expect(client).toBe(SNAPSHOT_CLIENT);
      expect(duckdb).toBe(DUCKDB_CONNECTION);
    }
  });

  it("passes each reviewed view definition directly to the writer", async () => {
    await handler(event, context);

    expect(mocks.writeRelationToFileMock).toHaveBeenCalledTimes(RELATIONS.length);
    RELATIONS.forEach((relation, index) => {
      const [, , calledRelation, calledDefinition, calledPath] = mocks.writeRelationToFileMock.mock.calls[index];
      expect(calledRelation).toBe(relation);
      expect(calledDefinition).toBe(definitionFor(relation));
      expect(calledPath).toBe(`/tmp/${relation}.parquet`);
    });
  });

  it("writes the success marker with the run date and every row count", async () => {
    await handler(event, context);

    expect(mocks.uploadSuccessMarkerMock).toHaveBeenCalledWith(
      RUN_TIME,
      RELATIONS.map((relation) => ({
        relation,
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

  it("does not mark the run successful when an upload fails", async () => {
    mocks.uploadParquetMock.mockRejectedValueOnce(new Error("s3 access denied"));

    await expect(handler(event, context)).rejects.toThrow("s3 access denied");

    expect(mocks.uploadSuccessMarkerMock).not.toHaveBeenCalled();
    expect(mocks.removeStagedFileMock).toHaveBeenCalledWith(
      `/tmp/${RELATIONS[0]}.parquet`
    );
  });

  it("does not mark the run successful when the snapshot commit fails", async () => {
    mocks.withSnapshotMock.mockImplementationOnce(
      async (_pool: unknown, _tables: string[], fn: (client: unknown) => Promise<unknown>) => {
        await fn(SNAPSHOT_CLIENT);
        throw new Error("commit failed");
      }
    );

    await expect(handler(event, context)).rejects.toThrow("commit failed");

    expect(mocks.uploadParquetMock).toHaveBeenCalledTimes(RELATIONS.length);
    expect(mocks.uploadSuccessMarkerMock).not.toHaveBeenCalled();
    expect(mocks.cleanupTmpMock).toHaveBeenCalledTimes(1);
  });

  it("does not upload or mark the run when the view query fails", async () => {
    mocks.writeRelationToFileMock.mockRejectedValueOnce(new Error("permission denied for table person"));

    await expect(handler(event, context)).rejects.toThrow("permission denied for table person");

    expect(mocks.uploadParquetMock).not.toHaveBeenCalled();
    expect(mocks.uploadSuccessMarkerMock).not.toHaveBeenCalled();
    expect(mocks.removeStagedFileMock).toHaveBeenCalledWith(`/tmp/${RELATIONS[0]}.parquet`);
    expect(mocks.logErrorMock).toHaveBeenCalledWith(
      { error: "permission denied for table person" },
      "data export failed."
    );
  });

  it("always cleans up the staging directory", async () => {
    await handler(event, context);
    expect(mocks.cleanupTmpMock).toHaveBeenCalledTimes(1);

    mocks.writeRelationToFileMock.mockRejectedValue(new Error("boom"));
    await expect(handler(event, context)).rejects.toThrow("boom");
    expect(mocks.cleanupTmpMock).toHaveBeenCalledTimes(2);
  });
});
