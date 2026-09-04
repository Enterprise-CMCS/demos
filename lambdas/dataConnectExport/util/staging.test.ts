import { readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { cleanupTmp, stagingPath } from "./staging";

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
      path.join(os.tmpdir(), "demonstration.parquet")
    );
  });

  it("names the file after the relation with a parquet extension", () => {
    expect(path.basename(stagingPath("state"))).toBe("state.parquet");
  });

  it("puts nothing in a subdirectory, which would need an mkdir first", () => {
    expect(path.dirname(stagingPath("demonstration"))).toBe(os.tmpdir());
  });

  it("gives each relation its own path", () => {
    expect(stagingPath("demonstration")).not.toBe(stagingPath("state"));
  });
});

describe("cleanupTmp", () => {
  it("removes the files stagingPath produces", async () => {
    // The suffix cleanup filters on has to be the suffix
    // stagingPath appends, or staged files accumulate across warm invocations.
    const staged = stagingPath("demonstration");
    vi.mocked(readdir).mockResolvedValue([path.basename(staged)] as never);

    await cleanupTmp();
    expect(vi.mocked(rm)).toHaveBeenCalledWith(staged, { force: true });
  });

  it("leaves everything that is not a parquet file alone", async () => {
    vi.mocked(readdir).mockResolvedValue([
      "demonstration.parquet",
      "state.parquet",
      "some-lambda-runtime-file",
      "duckdb_temp",
      "notes.txt",
      "parquet",
    ] as never);

    await cleanupTmp();
    const removed = vi.mocked(rm).mock.calls.map(([target]) => path.basename(target as string));
    expect(removed).toEqual(["demonstration.parquet", "state.parquet"]);
  });

  it("joins each entry onto the temp directory rather than removing a bare name", async () => {
    vi.mocked(readdir).mockResolvedValue(["state.parquet"] as never);
    await cleanupTmp();
    expect(vi.mocked(rm)).toHaveBeenCalledWith(path.join(os.tmpdir(), "state.parquet"), {
      force: true,
    });
  });

  it("passes force so a file removed concurrently is not an error", async () => {
    vi.mocked(readdir).mockResolvedValue(["state.parquet"] as never);
    await cleanupTmp();
    expect(vi.mocked(rm).mock.calls[0][1]).toEqual({ force: true });
  });

  it("reads the directory once, however many files it removes", async () => {
    vi.mocked(readdir).mockResolvedValue(["a.parquet", "b.parquet", "c.parquet"] as never);
    await cleanupTmp();
    expect(vi.mocked(readdir)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(readdir)).toHaveBeenCalledWith(os.tmpdir());
    expect(vi.mocked(rm)).toHaveBeenCalledTimes(3);
  });

  it("reports how many files it removed", async () => {
    vi.mocked(readdir).mockResolvedValue(["a.parquet", "b.parquet"] as never);
    await cleanupTmp();
    expect(mocks.infoMock).toHaveBeenCalledWith(
      { removed: 2 },
      "removed staged parquet files from tmp"
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
      "failed to clean up staged parquet files"
    );
  });

  it("does not throw when a file cannot be removed", async () => {
    vi.mocked(readdir).mockResolvedValue(["state.parquet"] as never);
    vi.mocked(rm).mockRejectedValue(new Error("EBUSY: resource busy"));

    await expect(cleanupTmp()).resolves.toBeUndefined();
    expect(mocks.warnMock).toHaveBeenCalledWith(
      { error: "EBUSY: resource busy" },
      "failed to clean up staged parquet files"
    );
  });

  it("logs no success message when removal failed", async () => {
    vi.mocked(readdir).mockResolvedValue(["state.parquet"] as never);
    vi.mocked(rm).mockRejectedValue(new Error("EBUSY: resource busy"));

    await cleanupTmp();
    expect(mocks.infoMock).not.toHaveBeenCalled();
  });
});
