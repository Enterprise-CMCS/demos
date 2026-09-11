import type { Pool, PoolClient } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ warnMock: vi.fn() }));

// Mock the schema to avoid constructing a SecretsManagerClient at module load.
vi.mock("./pool", () => ({ dbSchema: "demos_app" }));
vi.mock("../log", () => ({ log: { warn: mocks.warnMock } }));

import { withSnapshot } from "./snapshot";

const RELATIONS = ["demonstration", "state"];
const SNAPSHOT_TIME = new Date("2026-09-04T07:00:04.250Z");

const BEGIN = "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY";
const LOCK = 'LOCK TABLE demos_app."demonstration", demos_app."state" IN ACCESS SHARE MODE';
const CLOCK = "SELECT clock_timestamp() AS snapshot_time";

type Harness = {
  pool: Pool;
  state: { sql: string[]; connects: number; releases: number };
};

function fakePool(failOn?: { statement: string; error: Error }): Harness {
  const state = { sql: [] as string[], connects: 0, releases: 0 };

  const client = {
    query: async (sql: string) => {
      state.sql.push(sql);
      if (failOn && sql.startsWith(failOn.statement)) {
        throw failOn.error;
      }
      return { rows: [{ snapshot_time: SNAPSHOT_TIME }] };
    },
    release: () => {
      state.releases += 1;
    },
  };

  return {
    pool: {
      connect: async () => {
        state.connects += 1;
        return client as unknown as PoolClient;
      },
    } as unknown as Pool,
    state,
  };
}

describe("withSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wraps the callback in one repeatable-read read-only transaction", async () => {
    const { pool, state } = fakePool();

    const result = await withSnapshot(pool, RELATIONS, async (client) => {
      await client.query("SELECT 1 -- callback");
    });

    expect(result).toBe(SNAPSHOT_TIME);
    // Assert the full sequence: lock before callback reads, then commit.
    expect(state.sql).toEqual([BEGIN, LOCK, CLOCK, "SELECT 1 -- callback", "COMMIT"]);
  });

  it("asks for repeatable read, not the read committed default", async () => {
    const { pool, state } = fakePool();
    await withSnapshot(pool, RELATIONS, async () => {});

    // READ COMMITTED takes a new snapshot per statement, and exports must be read-only.
    expect(state.sql[0]).toContain("REPEATABLE READ");
    expect(state.sql[0]).toContain("READ ONLY");
  });

  it("locks every relation it was given, schema qualified and in order", async () => {
    const { pool, state } = fakePool();
    await withSnapshot(pool, RELATIONS, async () => {});

    expect(state.sql[1]).toBe(LOCK);
  });

  it("takes the weakest lock that blocks a schema change", async () => {
    // ACCESS SHARE blocks schema rewrites without blocking ordinary writes.
    const { pool, state } = fakePool();
    await withSnapshot(pool, RELATIONS, async () => {});

    expect(state.sql[1]).toContain("IN ACCESS SHARE MODE");
    expect(state.sql[1]).not.toContain("EXCLUSIVE");
  });

  it("quotes a relation name the same way the reads will", async () => {
    const { pool, state } = fakePool();
    await withSnapshot(pool, ['odd"name'], async () => {});

    expect(state.sql[1]).toBe('LOCK TABLE demos_app."odd""name" IN ACCESS SHARE MODE');
  });

  it("returns the instant the snapshot was taken", async () => {
    const { pool } = fakePool();

    await expect(withSnapshot(pool, RELATIONS, async () => {})).resolves.toBe(
      SNAPSHOT_TIME
    );
  });

  it("reads the instant from clock_timestamp, not now()", async () => {
    // now() returns the BEGIN time, before any lock wait.
    const { pool, state } = fakePool();
    await withSnapshot(pool, RELATIONS, async () => {});

    expect(state.sql[2]).toContain("clock_timestamp()");
    expect(state.sql[2]).not.toContain("now()");
  });

  it("gives the callback the connection it opened the transaction on", async () => {
    const { pool, state } = fakePool();
    let received: PoolClient | undefined;

    await withSnapshot(pool, RELATIONS, async (client) => {
      received = client;
      return null;
    });

    // A second connection would read outside this snapshot.
    expect(state.connects).toBe(1);
    await received?.query("SELECT 2 -- same client");
    expect(state.sql).toContain("SELECT 2 -- same client");
  });

  it("rolls back and does not commit when the callback throws", async () => {
    const { pool, state } = fakePool();

    await expect(
      withSnapshot(pool, RELATIONS, async () => {
        throw new Error("duckdb copy failed");
      })
    ).rejects.toThrow("duckdb copy failed");

    expect(state.sql).toEqual([BEGIN, LOCK, CLOCK, "ROLLBACK"]);
    expect(state.sql).not.toContain("COMMIT");
  });

  it("reports the original error when the rollback also fails", async () => {
    // Preserve the export error if the broken connection also rejects ROLLBACK.
    const { pool } = fakePool({
      statement: "ROLLBACK",
      error: new Error("connection terminated unexpectedly"),
    });

    await expect(
      withSnapshot(pool, RELATIONS, async () => {
        throw new Error("s3 access denied");
      })
    ).rejects.toThrow("s3 access denied");

    expect(mocks.warnMock).toHaveBeenCalledWith(
      { error: "connection terminated unexpectedly" },
      "rollback failed after the export aborted"
    );
  });

  it("releases the connection after a successful run", async () => {
    const { pool, state } = fakePool();
    await withSnapshot(pool, RELATIONS, async () => {});

    expect(state.releases).toBe(1);
  });

  it("releases the connection after a failed run", async () => {
    // The pool has two connections, so a leak can starve the next invocation.
    const { pool, state } = fakePool();

    await expect(
      withSnapshot(pool, RELATIONS, async () => {
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");

    expect(state.releases).toBe(1);
  });

  it("releases the connection when the transaction never opened", async () => {
    const { pool, state } = fakePool({
      statement: "BEGIN",
      error: new Error("terminating connection due to administrator command"),
    });

    await expect(withSnapshot(pool, RELATIONS, async () => {})).rejects.toThrow(
      "terminating connection due to administrator command"
    );

    expect(state.releases).toBe(1);
  });

  it("does not run the callback when the lock cannot be taken", async () => {
    const { pool } = fakePool({
      statement: "LOCK TABLE",
      error: new Error("canceling statement due to lock timeout"),
    });
    const callback = vi.fn();

    await expect(withSnapshot(pool, RELATIONS, callback)).rejects.toThrow("lock timeout");

    expect(callback).not.toHaveBeenCalled();
  });

  it("refuses an empty relation list rather than emitting invalid SQL", async () => {
    // Reject an empty list before generating invalid LOCK TABLE SQL.
    const { pool, state } = fakePool();

    await expect(withSnapshot(pool, [], async () => {})).rejects.toThrow(
      "withSnapshot requires at least one relation to lock."
    );

    expect(state.connects).toBe(0);
  });
});
