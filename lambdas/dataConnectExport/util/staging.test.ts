import { readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { cleanupTmp, csvPath, removeStagedFile, stagingPath } from "./staging";

const mocks = vi.hoisted(() => ({
  infoMock: vi.fn(),
  warnMock: vi.fn(),
}));

vi.mock("node:fs/promises");
vi.mock("../log", () => ({
  log: { info: mocks.infoMock, warn: mocks.warnMock, error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readdir).mockResolvedValue([] as never);
  vi.mocked(rm).mockResolvedValue(undefined);
});

describe("stagingPath", () => {
  // Compared against os.tmpdir() rather than the literal /tmp, because on macOS that is a
  // private /var/folders path and in Lambda it is /tmp.
  it("stages a relation directly in the temp directory", () => {
    expect(stagingPath("demonstration")).toBe(
      path.join(os.tmpdir(), "dataconnect-export-demonstration.parquet")
    );
  });

  it("prefixes the relation name and uses a parquet extension", () => {
    expect(path.basename(stagingPath("state"))).toBe("dataconnect-export-state.parquet");
  });

  it("puts nothing in a subdirectory, which would need an mkdir first", () => {
    expect(path.dirname(stagingPath("demonstration"))).toBe(os.tmpdir());
  });

  it("gives each relation its own path", () => {
    expect(stagingPath("demonstration")).not.toBe(stagingPath("state"));
  });
});

describe("csvPath", () => {
  it("stages the csv beside the parquet in the temp directory", () => {
    expect(csvPath("demonstration")).toBe(
      path.join(os.tmpdir(), "dataconnect-export-demonstration.csv")
    );
  });

  it("gives each relation its own path", () => {
    expect(csvPath("demonstration")).not.toBe(csvPath("state"));
  });

  it("never collides with the parquet file for the same relation", () => {
    // Both exist at once until the writer converts and removes the csv.
    expect(csvPath("state")).not.toBe(stagingPath("state"));
  });
});

describe("removeStagedFile", () => {
  it("removes one staged file", async () => {
    await removeStagedFile("/tmp/demonstration.parquet");

    expect(vi.mocked(rm)).toHaveBeenCalledWith("/tmp/demonstration.parquet", {
      force: true,
    });
  });

  it("warns instead of replacing the export error when removal fails", async () => {
    vi.mocked(rm).mockRejectedValue(new Error("EBUSY: resource busy"));

    await expect(removeStagedFile("/tmp/state.parquet")).resolves.toBeUndefined();
    expect(mocks.warnMock).toHaveBeenCalledWith(
      { path: "/tmp/state.parquet", error: "EBUSY: resource busy" },
      "failed to remove staged export file"
    );
  });
});

describe("cleanupTmp", () => {
  it("removes the files stagingPath and csvPath produce", async () => {
    // The suffixes cleanup filters on have to be the suffixes those two append, or staged
    // files accumulate across warm invocations.
    const parquet = stagingPath("demonstration");
    const csv = csvPath("demonstration");
    vi.mocked(readdir).mockResolvedValue([
      path.basename(parquet),
      path.basename(csv),
    ] as never);

    await cleanupTmp();
    expect(vi.mocked(rm)).toHaveBeenCalledWith(parquet, { force: true });
    expect(vi.mocked(rm)).toHaveBeenCalledWith(csv, { force: true });
  });

  it("leaves everything that is not a staged export file alone", async () => {
    vi.mocked(readdir).mockResolvedValue([
      "dataconnect-export-demonstration.parquet",
      "dataconnect-export-state.parquet",
      "dataconnect-export-demonstration.csv",
      "other.parquet",
      "other.csv",
      "some-lambda-runtime-file",
      "duckdb_temp",
      "notes.txt",
      "parquet",
      "csv",
    ] as never);

    await cleanupTmp();
    const removed = vi.mocked(rm).mock.calls.map(([target]) => path.basename(target as string));
    expect(removed).toEqual([
      "dataconnect-export-demonstration.parquet",
      "dataconnect-export-state.parquet",
      "dataconnect-export-demonstration.csv",
    ]);
  });

  it("joins each entry onto the temp directory rather than removing a bare name", async () => {
    const entry = path.basename(stagingPath("state"));
    vi.mocked(readdir).mockResolvedValue([entry] as never);
    await cleanupTmp();
    expect(vi.mocked(rm)).toHaveBeenCalledWith(path.join(os.tmpdir(), entry), {
      force: true,
    });
  });

  it("passes force so a file removed concurrently is not an error", async () => {
    vi.mocked(readdir).mockResolvedValue([
      path.basename(stagingPath("state")),
    ] as never);
    await cleanupTmp();
    expect(vi.mocked(rm).mock.calls[0][1]).toEqual({ force: true });
  });

  it("reads the directory once, however many files it removes", async () => {
    vi.mocked(readdir).mockResolvedValue([
      "dataconnect-export-a.parquet",
      "dataconnect-export-b.parquet",
      "dataconnect-export-c.parquet",
    ] as never);
    await cleanupTmp();
    expect(vi.mocked(readdir)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(readdir)).toHaveBeenCalledWith(os.tmpdir());
    expect(vi.mocked(rm)).toHaveBeenCalledTimes(3);
  });

  it("reports how many files it removed", async () => {
    vi.mocked(readdir).mockResolvedValue([
      "dataconnect-export-a.parquet",
      "dataconnect-export-b.parquet",
    ] as never);
    await cleanupTmp();
    expect(mocks.infoMock).toHaveBeenCalledWith(
      { removed: 2 },
      "removed staged export files from tmp"
    );
  });

  it("stays quiet when there was nothing to remove", async () => {
    vi.mocked(readdir).mockResolvedValue(["some-other-file"] as never);
    await cleanupTmp();
    expect(vi.mocked(rm)).not.toHaveBeenCalled();
    expect(mocks.infoMock).not.toHaveBeenCalled();
  });

  it("does not throw when the directory cannot be read", async () => {
    // Called from a finally block. Throwing here would replace the error that actually
    // aborted the export, and CloudWatch would show a cleanup problem instead.
    vi.mocked(readdir).mockRejectedValue(new Error("EACCES: permission denied"));

    await expect(cleanupTmp()).resolves.toBeUndefined();
    expect(mocks.warnMock).toHaveBeenCalledWith(
      { error: "EACCES: permission denied" },
      "failed to clean up staged export files"
    );
  });

  it("does not throw when a file cannot be removed", async () => {
    vi.mocked(readdir).mockResolvedValue([
      path.basename(stagingPath("state")),
    ] as never);
    vi.mocked(rm).mockRejectedValue(new Error("EBUSY: resource busy"));

    await expect(cleanupTmp()).resolves.toBeUndefined();
    expect(mocks.warnMock).toHaveBeenCalledWith(
      { error: "EBUSY: resource busy" },
      "failed to clean up staged export files"
    );
  });

  it("logs no success message when removal failed", async () => {
    vi.mocked(readdir).mockResolvedValue([
      path.basename(stagingPath("state")),
    ] as never);
    vi.mocked(rm).mockRejectedValue(new Error("EBUSY: resource busy"));

    await cleanupTmp();
    expect(mocks.infoMock).not.toHaveBeenCalled();
  });
});
