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
  dbSchema: "demos_app",
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

vi.mock("./budgetNeutralityValidation", async () => {
  const actual = await vi.importActual("./budgetNeutralityValidation");
  return {
    ...actual,
    getS3Path: vi.fn().mockResolvedValue("s3://test-bucket/test-file.xlsx"),
  };
});

vi.mock("./s3", () => ({
  downloadDocumentFromS3: vi.fn().mockResolvedValue("/tmp/test-file.xlsx"),
}));

vi.mock("demos-shared-library/BN", () => {
  class BNWorkbookInputError extends Error {
    constructor(readonly validationError: { code: string; message: string }) {
      super(validationError.message);
    }
  }
  return {
    BNWorkbookInputError,
    parseBNWorkbook: vi.fn().mockResolvedValue({
      data: [],
      cachedValuesMayBeStale: false,
      warnings: [],
    }),
  };
});

vi.mock("demos-shared-library/BN/validation", () => ({
  validateBNWorkbook: vi.fn().mockResolvedValue({
    isValid: true,
    errors: [],
    extractedValues: new Map<string, string | number>([["netVariance", 0]]),
  }),
}));

import { handler } from "./index";
import { documentExists } from "./budgetNeutralityValidation";
import { BNWorkbookInputError, parseBNWorkbook } from "demos-shared-library/BN";
import { validateBNWorkbook } from "demos-shared-library/BN/validation";

function createPool() {
  const release = vi.fn();
  const client = { query: mocks.queryMock, release };
  const pool = {
    query: mocks.queryMock,
    connect: vi.fn().mockResolvedValue(client),
  } as unknown as Pool;
  mocks.queryMock.mockImplementation(async (query: string) => {
    if (query.includes("UPDATE")) return { rows: [], rowCount: 1 };
    return { rows: [] };
  });
  return { pool, client };
}

describe("budgetNeutrality index", () => {
  beforeEach(() => {
    mocks.queryMock.mockReset();
    mocks.getDbPoolMock.mockReset();
    mocks.reqIdChildMock.mockReset();
    mocks.logInfoMock.mockReset();
    mocks.logWarnMock.mockReset();
    mocks.logErrorMock.mockReset();
    vi.mocked(parseBNWorkbook).mockReset().mockResolvedValue({
      data: [],
      cachedValuesMayBeStale: false,
      warnings: [],
    });
    vi.mocked(validateBNWorkbook).mockReset().mockResolvedValue({
      isValid: true,
      errors: [],
      extractedValues: new Map<string, string | number>(),
    });
  });

  it("documentExists returns true when row exists", async () => {
    const pool = {
      query: mocks.queryMock.mockResolvedValueOnce({ rows: [{ exists: true }] }),
    } as unknown as Pool;

    const exists = await documentExists(pool, "0d3f4a68-195d-49ef-8d36-0cc0eaa31935");

    expect(exists).toBe(true);
    expect(mocks.queryMock).toHaveBeenCalledWith(expect.stringContaining("SELECT EXISTS"), [
      "0d3f4a68-195d-49ef-8d36-0cc0eaa31935",
    ]);
  });

  it("processes a single record and returns 200", async () => {
    const { pool, client } = createPool();
    mocks.getDbPoolMock.mockResolvedValue(pool);

    const event = {
      Records: [{ body: JSON.stringify({ documentId: "doc-1", documentTypeId: "BN Workbook" }) }],
    } as unknown as SQSEvent;

    const context = { awsRequestId: "test-request-id" } as Context;

    const response = await handler(event, context);

    expect(response).toEqual({
      statusCode: 200,
      body: "Processed 1 records.",
    });
    expect(mocks.getDbPoolMock).toHaveBeenCalledTimes(1);
    expect(mocks.queryMock).toHaveBeenCalledTimes(3);
    expect(mocks.queryMock.mock.calls[0]?.[0]).toBe("BEGIN");
    expect(mocks.queryMock.mock.calls[1]?.[0]).toContain("budget_neutrality_workbook");
    expect(mocks.queryMock.mock.calls[1]?.[1]).toEqual([
      "doc-1",
      "BN Workbook",
      "Succeeded",
      "[]",
      undefined,
      0,
    ]);
    expect(mocks.queryMock.mock.calls[2]?.[0]).toBe("COMMIT");
    expect(client.release).toHaveBeenCalledOnce();
    expect(mocks.logInfoMock).toHaveBeenCalledWith(
      {
        results: {
          processedRecords: 1,
          existingDocuments: 1,
          missingDocuments: 0,
          insertedWorkbooks: 1,
        },
      },
      "Budget Neutrality validation completed."
    );
    expect(mocks.logWarnMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "formula metadata",
      source: "parser",
      validationError: {
        code: "BN_FORMULA_METADATA",
        message: "Workbook formula metadata could not be inspected.",
      },
    },
    {
      name: "required sheet",
      source: "parser",
      validationError: {
        code: "BN_REQUIRED_WORKBOOK_SHEET",
        message: 'The workbook is missing the required "C Report" sheet.',
      },
    },
    {
      name: "required numeric value",
      source: "validation",
      validationError: {
        code: "BN_NET_VARIANCE_VALUE",
        message: "Summary!AS436 must be numeric.",
      },
    },
  ] as const)("records $name failures and clears stale children", async ({ source, validationError }) => {
    const { pool, client } = createPool();
    mocks.getDbPoolMock.mockResolvedValue(pool);
    if (source === "parser") {
      vi.mocked(parseBNWorkbook).mockRejectedValueOnce(new BNWorkbookInputError(validationError));
    } else {
      vi.mocked(validateBNWorkbook).mockResolvedValueOnce({
        isValid: false,
        errors: [validationError],
        extractedValues: new Map(),
      });
    }

    const event = {
      Records: [{ body: JSON.stringify({ documentId: "doc-1", documentTypeId: "BN Workbook" }) }],
    } as unknown as SQSEvent;
    const response = await handler(event, { awsRequestId: "test-request-id" } as Context);

    expect(response.statusCode).toBe(200);
    expect(validateBNWorkbook).toHaveBeenCalledTimes(source === "parser" ? 0 : 1);
    expect(mocks.queryMock).toHaveBeenCalledTimes(7);
    expect(mocks.queryMock.mock.calls[1]?.[1]).toEqual([
      "doc-1",
      "BN Workbook",
      "Failed",
      JSON.stringify([validationError]),
      undefined,
      undefined,
    ]);
    expect(mocks.queryMock.mock.calls.slice(2, 6).every(([query]) => String(query).startsWith("DELETE"))).toBe(true);
    const cleanupCalls = mocks.queryMock.mock.calls.slice(2, 6);
    expect(cleanupCalls).toHaveLength(4);
    for (const [query, parameters] of cleanupCalls) {
      expect(query).toMatch(/WHERE\s+workbook_id\s*=\s*\$1::UUID/i);
      expect(parameters).toEqual(["doc-1"]);
    }
    expect(cleanupCalls[2]?.[0]).toMatch(/budget_neutrality_workbook_spending_limit_meg\s+WHERE\s+workbook_id\s*=\s*\$1::UUID/i);
    expect(mocks.queryMock.mock.calls[6]?.[0]).toBe("COMMIT");
    expect(client.release).toHaveBeenCalledOnce();
  });

  it("rethrows unexpected parser failures without recording a workbook validation failure", async () => {
    const { pool } = createPool();
    mocks.getDbPoolMock.mockResolvedValue(pool);
    const failure = new Error("temporary filesystem failure");
    vi.mocked(parseBNWorkbook).mockRejectedValueOnce(failure);

    const event = {
      Records: [{ body: JSON.stringify({ documentId: "doc-1", documentTypeId: "BN Workbook" }) }],
    } as unknown as SQSEvent;

    await expect(handler(event, { awsRequestId: "test-request-id" } as Context)).rejects.toBe(failure);
    expect(mocks.queryMock).not.toHaveBeenCalled();
  });

  it("rolls back when the workbook update affects no rows", async () => {
    const { pool, client } = createPool();
    mocks.getDbPoolMock.mockResolvedValue(pool);
    mocks.queryMock.mockImplementation(async (query: string) => {
      if (query.includes("UPDATE")) return { rows: [], rowCount: 0 };
      return { rows: [] };
    });
    const event = {
      Records: [{ body: JSON.stringify({ documentId: "doc-1", documentTypeId: "BN Workbook" }) }],
    } as unknown as SQSEvent;

    await expect(handler(event, { awsRequestId: "test-request-id" } as Context)).rejects.toThrow(
      "Budget Neutrality workbook doc-1 not found."
    );

    expect(mocks.queryMock.mock.calls.map(([query]) => query)).toEqual([
      "BEGIN",
      expect.stringContaining("UPDATE"),
      "ROLLBACK",
    ]);
    expect(client.release).toHaveBeenCalledOnce();
  });

  it("rolls back operational database failures so the message can be retried", async () => {
    const { pool, client } = createPool();
    mocks.getDbPoolMock.mockResolvedValue(pool);
    const failure = new Error("temporary database failure");
    mocks.queryMock.mockImplementation(async (query: string) => {
      if (query.includes("UPDATE")) throw failure;
      return { rows: [] };
    });
    const event = {
      Records: [{ body: JSON.stringify({ documentId: "doc-1", documentTypeId: "BN Workbook" }) }],
    } as unknown as SQSEvent;

    await expect(handler(event, { awsRequestId: "test-request-id" } as Context)).rejects.toBe(failure);

    expect(mocks.queryMock.mock.calls.map(([query]) => query)).toEqual([
      "BEGIN",
      expect.stringContaining("UPDATE"),
      "ROLLBACK",
    ]);
    expect(client.release).toHaveBeenCalledOnce();
  });

  it("rolls back failed-workbook cleanup so the message can be retried", async () => {
    const { pool, client } = createPool();
    mocks.getDbPoolMock.mockResolvedValue(pool);
    const failure = new Error("temporary cleanup failure");
    mocks.queryMock.mockImplementation(async (query: string) => {
      if (query.includes("UPDATE")) return { rows: [], rowCount: 1 };
      if (query.includes("spending_limit_meg")) throw failure;
      return { rows: [] };
    });
    vi.mocked(validateBNWorkbook).mockResolvedValueOnce({
      isValid: false,
      errors: [{ code: "BN_REQUIRED_WORKBOOK_SHEET", message: "Required sheet missing." }],
      extractedValues: new Map(),
    });
    const event = {
      Records: [{ body: JSON.stringify({ documentId: "doc-1", documentTypeId: "BN Workbook" }) }],
    } as unknown as SQSEvent;

    await expect(handler(event, { awsRequestId: "test-request-id" } as Context)).rejects.toBe(failure);

    expect(mocks.queryMock.mock.calls.map(([query]) => query)).toEqual([
      "BEGIN",
      expect.stringContaining("UPDATE"),
      expect.stringContaining("budget_neutrality_workbook_hypothetical_value"),
      expect.stringContaining("budget_neutrality_workbook_hypothetical_year"),
      expect.stringContaining("budget_neutrality_workbook_spending_limit_meg"),
      "ROLLBACK",
    ]);
    expect(client.release).toHaveBeenCalledOnce();
  });

  it("throws when event includes more than one record", async () => {
    const pool = { query: mocks.queryMock } as unknown as Pool;
    mocks.getDbPoolMock.mockResolvedValue(pool);

    const event = {
      Records: [
        { body: JSON.stringify({ documentId: "doc-1", documentTypeId: "BN Workbook" }) },
        { body: JSON.stringify({ documentId: "doc-2", documentTypeId: "BN Workbook" }) },
      ],
    } as unknown as SQSEvent;

    const context = { awsRequestId: "test-request-id" } as Context;

    await expect(handler(event, context)).rejects.toThrow(
      "Lambda failed: Expected exactly 1 record, received 2."
    );
  });

  it("throws when message omits documentTypeId", async () => {
    const pool = { query: mocks.queryMock } as unknown as Pool;
    mocks.getDbPoolMock.mockResolvedValue(pool);

    const event = {
      Records: [{ body: JSON.stringify({ documentId: "c9e2fe09-8f9d-4d6f-a03d-e502afaf3124" }) }],
    } as unknown as SQSEvent;

    const context = { awsRequestId: "test-request-id" } as Context;
    await expect(handler(event, context)).rejects.toThrow(
      "Lambda failed: Invalid message: documentTypeId is required."
    );
    expect(mocks.queryMock).not.toHaveBeenCalled();
  });

  it("throws when documentTypeId is not BN Workbook", async () => {
    const pool = { query: mocks.queryMock } as unknown as Pool;
    mocks.getDbPoolMock.mockResolvedValue(pool);

    const event = {
      Records: [
        { body: JSON.stringify({ documentId: "doc-1", documentTypeId: "State Application" }) },
      ],
    } as unknown as SQSEvent;

    const context = { awsRequestId: "test-request-id" } as Context;

    await expect(handler(event, context)).rejects.toThrow(
      'Lambda failed: Invalid message: documentTypeId must be "BN Workbook". Received "State Application".'
    );
    expect(mocks.queryMock).not.toHaveBeenCalled();
  });

  it("throws when message is invalid", async () => {
    const pool = { query: mocks.queryMock } as unknown as Pool;
    mocks.getDbPoolMock.mockResolvedValue(pool);

    const event = {
      Records: [{ body: JSON.stringify({ documentTypeId: "BN Workbook" }) }],
    } as unknown as SQSEvent;

    const context = { awsRequestId: "test-request-id" } as Context;

    await expect(handler(event, context)).rejects.toThrow(
      "Lambda failed: Invalid message: documentId is required."
    );
    expect(mocks.logErrorMock).toHaveBeenCalledTimes(1);
  });
});
