import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Context, SQSEvent } from "aws-lambda";
import type { Pool } from "pg";

const mocks = vi.hoisted(() => ({
  queryMock: vi.fn(),
  clientQueryMock: vi.fn(),
  connectMock: vi.fn(),
  clientReleaseMock: vi.fn(),
  getDbPoolMock: vi.fn(),
  reqIdChildMock: vi.fn(),
  logInfoMock: vi.fn(),
  logWarnMock: vi.fn(),
  logErrorMock: vi.fn(),
  parseBNWorkbookMock: vi.fn(),
  validateBNWorkbookMock: vi.fn(),
  extractBNReportingMock: vi.fn(),
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

vi.mock("demos-shared-library/BN", () => ({
  parseBNWorkbook: (...args: unknown[]) => mocks.parseBNWorkbookMock(...args),
}));

vi.mock("demos-shared-library/BN/validation", () => ({
  validateBNWorkbook: (...args: unknown[]) => mocks.validateBNWorkbookMock(...args),
}));

vi.mock("demos-shared-library/BN/rulesets", () => ({
  validations: [],
}));

vi.mock("demos-shared-library/BN/extractors", () => ({
  BN_PARSER_VERSION: "v2.14-1",
  extractorFunctions: [],
  extractBNReporting: (...args: unknown[]) => mocks.extractBNReportingMock(...args),
}));

import { handler, updateBudgetNeutralityWorkbook } from "./index";
import { documentExists } from "./budgetNeutralityValidation";
import type { BNWorkbookExtract } from "demos-shared-library/BN/extractors";

const DOCUMENT_ID = "0d3f4a68-195d-49ef-8d36-0cc0eaa31935";
const MESSAGE = { documentId: DOCUMENT_ID, documentTypeId: "BN Workbook" };
const EXPECTED_DELETE_CHILD_SNAPSHOT_QUERIES = [
  "DELETE FROM demos_app.budget_neutrality_workbook_spending_limit WHERE workbook_id = $1::UUID",
  "DELETE FROM demos_app.budget_neutrality_workbook_test_value WHERE workbook_id = $1::UUID",
  "DELETE FROM demos_app.budget_neutrality_workbook_test_year WHERE workbook_id = $1::UUID",
];

function emptyReportingExtract(): BNWorkbookExtract {
  return { testValues: [], testYears: [], spendingLimits: [] };
}

function populatedReportingExtract(): BNWorkbookExtract {
  return {
    testValues: [
      { testId: "Main", measureId: "Net Variance", megName: null, dyNumber: null, value: 0 },
      { testId: "Hypothetical 1", measureId: "Without-Waiver Total", megName: null, dyNumber: 1, value: 0 },
    ],
    testYears: [{ testId: "Main", dyNumber: 1, capNeeded: false }],
    spendingLimits: [{
      programIndex: 1,
      programName: "Program A",
      capTotal: 0,
      varianceTotal: 0,
      overCap: false,
      megs: [{ lineNumber: 1, megName: "MEG A", subjectToCapTotal: 0 }],
    }],
  };
}

function successfulValidationResults() {
  return {
    isValid: true,
    errors: [],
    extractedValues: new Map<string, string | number>([
      ["actuals", "Actuals + Projected"],
      ["netVariance", 0],
    ]),
  };
}

function setupPersistenceClient(parentRows = [{ id: DOCUMENT_ID }]): void {
  mocks.clientQueryMock.mockImplementation((query: string) => {
    if (query.includes("UPDATE demos_app.budget_neutrality_workbook")) {
      return Promise.resolve({ rows: parentRows });
    }
    return Promise.resolve({ rows: [] });
  });
}

function createPool(): Pool {
  return { query: mocks.queryMock, connect: mocks.connectMock } as unknown as Pool;
}

describe("budgetNeutrality index", () => {
  beforeEach(() => {
    mocks.queryMock.mockReset();
    mocks.clientQueryMock.mockReset();
    mocks.clientReleaseMock.mockReset();
    mocks.connectMock.mockReset().mockResolvedValue({
      query: mocks.clientQueryMock,
      release: mocks.clientReleaseMock,
    });
    mocks.getDbPoolMock.mockReset();
    mocks.reqIdChildMock.mockReset();
    mocks.logInfoMock.mockReset();
    mocks.logWarnMock.mockReset();
    mocks.logErrorMock.mockReset();
    mocks.parseBNWorkbookMock.mockReset().mockResolvedValue({
      data: [],
      cachedValuesMayBeStale: false,
      warnings: [],
    });
    mocks.validateBNWorkbookMock.mockReset().mockResolvedValue({
      isValid: true,
      errors: [],
      extractedValues: new Map<string, string | number>([
        ["actuals", "Actuals + Projected"],
        ["netVariance", 0],
        ["reportingStartDy", 1],
        ["reportingEndDy", 2],
      ]),
    });
    mocks.extractBNReportingMock.mockReset().mockReturnValue({
      extract: emptyReportingExtract(),
      warnings: [],
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
    setupPersistenceClient();
    const pool = createPool();
    mocks.getDbPoolMock.mockResolvedValue(pool);

    const event = {
      Records: [{ body: JSON.stringify(MESSAGE) }],
    } as unknown as SQSEvent;

    const context = { awsRequestId: "test-request-id" } as Context;

    const response = await handler(event, context);

    expect(response).toEqual({
      statusCode: 200,
      body: "Processed 1 records.",
    });
    expect(mocks.getDbPoolMock).toHaveBeenCalledTimes(1);
    expect(mocks.queryMock).not.toHaveBeenCalled();
    expect(mocks.connectMock).toHaveBeenCalledTimes(1);
    expect(mocks.clientQueryMock.mock.calls[0]?.[0]).toBe("BEGIN");
    expect(mocks.clientQueryMock.mock.calls.at(-1)?.[0]).toBe("COMMIT");
    expect(mocks.clientQueryMock.mock.calls.find(([query]) => String(query).includes("UPDATE demos_app.budget_neutrality_workbook"))?.[1]).toEqual([
      DOCUMENT_ID,
      "BN Workbook",
      "Succeeded",
      "[]",
      "Actuals + Projected",
      0,
    ]);
    expect(mocks.parseBNWorkbookMock).toHaveBeenCalledWith("/tmp/test-file.xlsx");
    expect(mocks.extractBNReportingMock).toHaveBeenCalledWith(
      [],
      expect.any(Map),
      { maxHypotheticalTest: 13 },
    );
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
    expect(mocks.clientReleaseMock).toHaveBeenCalledTimes(1);
  });

  it("records validation failures and clears parent values and child snapshots without retrying", async () => {
    setupPersistenceClient();
    mocks.getDbPoolMock.mockResolvedValue(createPool());
    mocks.validateBNWorkbookMock.mockResolvedValue({
      isValid: false,
      errors: [{ code: "BN_NET_VARIANCE_LOCATION", message: "Expected Summary!AS436; detected Summary!AS449." }],
      extractedValues: new Map<string, string | number>([["actuals", "wrong"], ["netVariance", 123]]),
    });

    const response = await handler({
      Records: [{ body: JSON.stringify(MESSAGE) }],
    } as unknown as SQSEvent, { awsRequestId: "test-request-id" } as Context);

    expect(response.statusCode).toBe(200);
    expect(mocks.extractBNReportingMock).not.toHaveBeenCalled();
    const updateCall = mocks.clientQueryMock.mock.calls.find(([query]) => String(query).includes("UPDATE demos_app.budget_neutrality_workbook"));
    expect(updateCall?.[1]).toEqual([
      DOCUMENT_ID,
      "BN Workbook",
      "Failed",
      JSON.stringify([{ code: "BN_NET_VARIANCE_LOCATION", message: "Expected Summary!AS436; detected Summary!AS449." }]),
      null,
      null,
    ]);
    expect(mocks.clientQueryMock.mock.calls.filter(([query]) => String(query).startsWith("DELETE FROM")).map(([query]) => query))
      .toEqual(EXPECTED_DELETE_CHILD_SNAPSHOT_QUERIES);
    expect(mocks.clientQueryMock.mock.calls.some(([query]) => String(query).startsWith("INSERT INTO"))).toBe(false);
    expect(mocks.clientQueryMock.mock.calls.at(-1)?.[0]).toBe("COMMIT");
    expect(mocks.logWarnMock).toHaveBeenCalledWith(
      expect.objectContaining({ documentId: DOCUMENT_ID, validationError: expect.objectContaining({ code: "BN_NET_VARIANCE_LOCATION" }) }),
      "BN workbook validation error.",
    );
  });

  it("logs cached-value and extraction warnings with the document and parser version", async () => {
    setupPersistenceClient();
    mocks.getDbPoolMock.mockResolvedValue(createPool());
    mocks.parseBNWorkbookMock.mockResolvedValue({
      data: [],
      cachedValuesMayBeStale: true,
      warnings: ["cached formula values may be stale"],
    });
    const totalsOnlyExtract = {
      ...emptyReportingExtract(),
      testValues: [{ testId: "Main", measureId: "Without-Waiver Total", megName: null, dyNumber: null, value: 5 }],
    };
    mocks.validateBNWorkbookMock.mockResolvedValue({
      isValid: true,
      errors: [],
      extractedValues: new Map<string, string | number>([["actuals", "Actuals + Projected"], ["netVariance", 0], ["reportingStartDy", 3], ["reportingEndDy", 2]]),
    });
    mocks.extractBNReportingMock.mockReturnValue({
      extract: totalsOnlyExtract,
      warnings: ["optional field warning", "invalid DY bounds; totals only", "Summary section omitted", "Spending limits omitted"],
    });

    await handler({ Records: [{ body: JSON.stringify(MESSAGE) }] } as unknown as SQSEvent,
      { awsRequestId: "test-request-id" } as Context);

    expect(mocks.logInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: DOCUMENT_ID,
        parserVersion: "v2.14-1",
        cachedValuesMayBeStale: true,
      }),
      "BN workbook parsed.",
    );
    const warnings = mocks.logWarnMock.mock.calls
      .filter(([, message]) => message === "BN workbook extraction warning.")
      .map(([context]) => (context as { warning: string }).warning);
    expect(warnings).toEqual([
      "cached formula values may be stale",
      "optional field warning",
      "invalid DY bounds; totals only",
      "Summary section omitted",
      "Spending limits omitted",
    ]);
    for (const warning of warnings) {
      expect(mocks.logWarnMock).toHaveBeenCalledWith(
        expect.objectContaining({ documentId: DOCUMENT_ID, parserVersion: "v2.14-1", warning }),
        "BN workbook extraction warning.",
      );
    }
    expect(mocks.extractBNReportingMock).toHaveBeenCalledWith(
      [],
      new Map<string, string | number>([["actuals", "Actuals + Projected"], ["netVariance", 0], ["reportingStartDy", 3], ["reportingEndDy", 2]]),
      { maxHypotheticalTest: 13 },
    );
    expect(totalsOnlyExtract.testValues.every(({ dyNumber }) => dyNumber === null)).toBe(true);
  });

  it("replaces all structured child tables in one transaction and preserves zero and false", async () => {
    setupPersistenceClient();

    await updateBudgetNeutralityWorkbook(
      createPool(),
      MESSAGE,
      successfulValidationResults(),
      populatedReportingExtract(),
    );

    const calls = mocks.clientQueryMock.mock.calls;
    expect(calls[0]?.[0]).toBe("BEGIN");
    expect(calls.at(-1)?.[0]).toBe("COMMIT");
    expect(calls.filter(([query]) => String(query).startsWith("DELETE FROM")).map(([query]) => query))
      .toEqual(EXPECTED_DELETE_CHILD_SNAPSHOT_QUERIES);
    const inserts = calls.filter(([query]) => String(query).startsWith("INSERT INTO"));
    expect(inserts).toHaveLength(4);

    const valuesInsert = inserts.find(([query]) => String(query).includes("budget_neutrality_workbook_test_value"));
    expect(valuesInsert?.[1]).toHaveLength(14);
    expect(valuesInsert?.[1]?.[0]).toMatch(/^[0-9a-f-]{36}$/i);
    expect(valuesInsert?.[1]?.slice(1, 7)).toEqual([
      DOCUMENT_ID, "Main", "Net Variance", null, null, 0,
    ]);
    expect(valuesInsert?.[1]?.slice(8)).toEqual([
      DOCUMENT_ID, "Hypothetical 1", "Without-Waiver Total", null, 1, 0,
    ]);

    const yearsInsert = inserts.find(([query]) => String(query).includes("budget_neutrality_workbook_test_year"));
    expect(yearsInsert?.[1]).toEqual([DOCUMENT_ID, "Main", 1, false]);
    const spendingInsert = inserts.find(([query]) => String(query).includes("budget_neutrality_workbook_spending_limit ("));
    expect(spendingInsert?.[1]).toEqual([DOCUMENT_ID, 1, "Program A", 0, 0, false]);
    const megInsert = inserts.find(([query]) => String(query).includes("budget_neutrality_workbook_spending_limit_meg"));
    expect(megInsert?.[1]).toEqual([DOCUMENT_ID, 1, 1, "MEG A", 0]);
    expect(mocks.clientReleaseMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a valid result without a reporting extract and rolls back", async () => {
    setupPersistenceClient();

    await expect(updateBudgetNeutralityWorkbook(
      createPool(),
      MESSAGE,
      successfulValidationResults(),
      null,
    )).rejects.toThrow("A valid BN workbook extraction is required");

    expect(mocks.clientQueryMock.mock.calls.at(-1)?.[0]).toBe("ROLLBACK");
    expect(mocks.clientQueryMock.mock.calls.some(([query]) => String(query) === "COMMIT")).toBe(false);
    expect(mocks.clientReleaseMock).toHaveBeenCalledTimes(1);
  });

  it("fails safely and rolls back when the parent workbook is missing", async () => {
    setupPersistenceClient([]);

    await expect(updateBudgetNeutralityWorkbook(
      createPool(),
      MESSAGE,
      successfulValidationResults(),
      emptyReportingExtract(),
    )).rejects.toThrow(`No unique BN workbook record found for document ${DOCUMENT_ID}`);

    expect(mocks.clientQueryMock.mock.calls.at(-1)?.[0]).toBe("ROLLBACK");
    expect(mocks.clientQueryMock.mock.calls.some(([query]) => String(query).startsWith("DELETE FROM"))).toBe(false);
    expect(mocks.clientReleaseMock).toHaveBeenCalledTimes(1);
  });

  it("rolls back the parent and child snapshot when a child batch fails", async () => {
    setupPersistenceClient();
    mocks.clientQueryMock.mockImplementation((query: string) => {
      if (query.includes("UPDATE demos_app.budget_neutrality_workbook")) {
        return Promise.resolve({ rows: [{ id: DOCUMENT_ID }] });
      }
      if (query.startsWith("INSERT INTO demos_app.budget_neutrality_workbook_test_value")) {
        return Promise.reject(new Error("child batch failed"));
      }
      return Promise.resolve({ rows: [] });
    });

    await expect(updateBudgetNeutralityWorkbook(
      createPool(),
      MESSAGE,
      successfulValidationResults(),
      populatedReportingExtract(),
    )).rejects.toThrow("child batch failed");

    expect(mocks.clientQueryMock.mock.calls.at(-1)?.[0]).toBe("ROLLBACK");
    expect(mocks.clientQueryMock.mock.calls.some(([query]) => String(query) === "COMMIT")).toBe(false);
    expect(mocks.clientReleaseMock).toHaveBeenCalledTimes(1);
  });

  it("clears the previous child snapshot on every successful reprocessing", async () => {
    setupPersistenceClient();

    await updateBudgetNeutralityWorkbook(createPool(), MESSAGE, successfulValidationResults(), populatedReportingExtract());
    await updateBudgetNeutralityWorkbook(createPool(), MESSAGE, successfulValidationResults(), emptyReportingExtract());

    expect(mocks.clientQueryMock.mock.calls.filter(([query]) => String(query).startsWith("DELETE FROM")).map(([query]) => query))
      .toEqual([...EXPECTED_DELETE_CHILD_SNAPSHOT_QUERIES, ...EXPECTED_DELETE_CHILD_SNAPSHOT_QUERIES]);
    expect(mocks.clientQueryMock.mock.calls.filter(([query]) => String(query) === "COMMIT")).toHaveLength(2);
    expect(mocks.clientQueryMock.mock.calls.filter(([query]) => String(query).startsWith("INSERT INTO"))).toHaveLength(4);
    expect(mocks.clientReleaseMock).toHaveBeenCalledTimes(2);
  });

  it("uses separate transactions for concurrent reprocessing", async () => {
    const clientCalls: string[][] = [];
    const clientReleases = [vi.fn(), vi.fn()];
    mocks.connectMock.mockImplementation(async () => {
      const queries: string[] = [];
      clientCalls.push(queries);
      const query = vi.fn(async (sql: string) => {
        queries.push(sql);
        return sql.includes("UPDATE demos_app.budget_neutrality_workbook")
          ? { rows: [{ id: DOCUMENT_ID }] }
          : { rows: [] };
      });
      return { query, release: clientReleases[clientCalls.length - 1] };
    });

    await Promise.all([
      updateBudgetNeutralityWorkbook(createPool(), MESSAGE, successfulValidationResults(), emptyReportingExtract()),
      updateBudgetNeutralityWorkbook(createPool(), MESSAGE, successfulValidationResults(), emptyReportingExtract()),
    ]);

    expect(clientCalls).toHaveLength(2);
    for (const queries of clientCalls) {
      expect(queries[0]).toBe("BEGIN");
      expect(queries.some((query) => query.includes("UPDATE demos_app.budget_neutrality_workbook") && query.includes("RETURNING id"))).toBe(true);
      expect(queries.filter((query) => query.startsWith("DELETE FROM")))
        .toEqual(EXPECTED_DELETE_CHILD_SNAPSHOT_QUERIES);
      expect(queries.at(-1)).toBe("COMMIT");
    }
    expect(clientReleases[0]).toHaveBeenCalledTimes(1);
    expect(clientReleases[1]).toHaveBeenCalledTimes(1);
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
