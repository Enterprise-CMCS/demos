import { describe, expect, it, vi, beforeEach } from "vitest";
import { SQSEvent, Context } from "aws-lambda";
import { Pool } from "pg";

const mocks = vi.hoisted(() => ({
  queryMock: vi.fn(),
  getDbPoolMock: vi.fn(),
  reqIdChildMock: vi.fn(),
  logInfoMock: vi.fn(),
  logWarnMock: vi.fn(),
  logErrorMock: vi.fn(),
}));

vi.mock("./db", () => ({
  getDbPool: (...args: unknown[]) => mocks.getDbPoolMock(...args),
  getDbSchema: () => "demos_app",
}));

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

import { documentExists, handler } from "./index";

describe("budgetNeutrality index", () => {
  beforeEach(() => {
    mocks.queryMock.mockReset();
    mocks.getDbPoolMock.mockReset();
    mocks.reqIdChildMock.mockReset();
    mocks.logInfoMock.mockReset();
    mocks.logWarnMock.mockReset();
    mocks.logErrorMock.mockReset();
  });

  it("documentExists returns true when row exists", async () => {
    const pool = {
      query: mocks.queryMock.mockResolvedValueOnce({ rows: [{ exists: true }] }),
    } as unknown as Pool;

    const exists = await documentExists(pool, "0d3f4a68-195d-49ef-8d36-0cc0eaa31935");

    expect(exists).toBe(true);
    expect(mocks.queryMock).toHaveBeenCalledWith(
      expect.stringContaining("SELECT EXISTS"),
      ["0d3f4a68-195d-49ef-8d36-0cc0eaa31935"]
    );
  });

  it("processes records and returns 200", async () => {
    mocks.queryMock
      .mockResolvedValueOnce({ rows: [{ exists: true }] })
      .mockResolvedValueOnce({ rows: [{ exists: false }] });

    const pool = { query: mocks.queryMock } as unknown as Pool;
    mocks.getDbPoolMock.mockResolvedValue(pool);

    const event = {
      Records: [
        { body: JSON.stringify({ documentId: "doc-1", documentTypeId: "Final BN Worksheet" }) },
        { body: JSON.stringify({ documentId: "doc-2" }) },
      ],
    } as unknown as SQSEvent;

    const context = { awsRequestId: "test-request-id" } as Context;

    const response = await handler(event, context);

    expect(response).toEqual({
      statusCode: 200,
      body: "Processed 2 records.",
    });
    expect(mocks.getDbPoolMock).toHaveBeenCalledTimes(1);
    expect(mocks.queryMock).toHaveBeenCalledTimes(2);
    expect(mocks.logInfoMock).toHaveBeenCalledWith(
      { results: { processedRecords: 2, existingDocuments: 1, missingDocuments: 1 } },
      "Budget Neutrality validation placeholder completed."
    );
    expect(mocks.logWarnMock).toHaveBeenCalledTimes(1);
  });

  it("throws when message is invalid", async () => {
    const pool = { query: mocks.queryMock } as unknown as Pool;
    mocks.getDbPoolMock.mockResolvedValue(pool);

    const event = {
      Records: [{ body: JSON.stringify({ documentTypeId: "Final BN Worksheet" }) }],
    } as unknown as SQSEvent;

    const context = { awsRequestId: "test-request-id" } as Context;

    await expect(handler(event, context)).rejects.toThrow(
      "Lambda failed: Invalid message: documentId is required."
    );
    expect(mocks.logErrorMock).toHaveBeenCalledTimes(1);
  });
});
