import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createMock: vi.fn(),
  connectMock: vi.fn(),
  closeConnectionMock: vi.fn(),
  closeInstanceMock: vi.fn(),
}));

vi.mock("@duckdb/node-api", () => ({
  DuckDBInstance: { create: mocks.createMock },
}));

import { withDuckDBConnection } from "./duckdb";

const connection = { closeSync: mocks.closeConnectionMock };
const instance = {
  connect: mocks.connectMock,
  closeSync: mocks.closeInstanceMock,
};

describe("withDuckDBConnection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createMock.mockResolvedValue(instance);
    mocks.connectMock.mockResolvedValue(connection);
  });

  it("creates one in-memory instance and returns the callback result", async () => {
    const callback = vi.fn().mockResolvedValue("done");

    await expect(withDuckDBConnection(callback)).resolves.toBe("done");
    expect(mocks.createMock).toHaveBeenCalledWith(":memory:");
    expect(callback).toHaveBeenCalledWith(connection);
  });

  it("closes the connection and instance after success", async () => {
    await withDuckDBConnection(async () => null);

    expect(mocks.closeConnectionMock).toHaveBeenCalledTimes(1);
    expect(mocks.closeInstanceMock).toHaveBeenCalledTimes(1);
  });

  it("closes the connection and instance after a callback failure", async () => {
    await expect(
      withDuckDBConnection(async () => {
        throw new Error("conversion failed");
      })
    ).rejects.toThrow("conversion failed");

    expect(mocks.closeConnectionMock).toHaveBeenCalledTimes(1);
    expect(mocks.closeInstanceMock).toHaveBeenCalledTimes(1);
  });

  it("closes the instance when opening the connection fails", async () => {
    mocks.connectMock.mockRejectedValue(new Error("connect failed"));

    await expect(withDuckDBConnection(async () => null)).rejects.toThrow("connect failed");

    expect(mocks.closeConnectionMock).not.toHaveBeenCalled();
    expect(mocks.closeInstanceMock).toHaveBeenCalledTimes(1);
  });
});
