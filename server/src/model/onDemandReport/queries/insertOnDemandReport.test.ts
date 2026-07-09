// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import { Prisma } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
import { OnDemandReportStatus, OnDemandReportType } from "../../../types";

// Functions under test
import { insertOnDemandReport } from "./insertOnDemandReport";
import { DeepPartial } from "../../../testUtilities";

describe("insertOnDemandReport", () => {
  // Test inputs
  const testInput: Prisma.OnDemandReportUncheckedCreateInput = {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    s3Path: "s3://clean-bucket/reports/on-demand/a1b2c3d4-e5f6-7890-abcd-ef1234567890.xlsx",
    generatedFileName: "Basic_Test_Report_20250115_150000.xlsx",
    requestingUserId: "11111111-2222-3333-4444-555555555555",
    reportTypeId: "Basic Test Report" satisfies OnDemandReportType,
    statusId: "Available" satisfies OnDemandReportStatus,
    reportGeneratedAt: new Date("2025-01-15T10:00:00.000Z"),
  };

  // Mock return values
  const transactionMocks = {
    onDemandReport: {
      create: vi.fn(),
    },
  };
  const mockTransaction: DeepPartial<PrismaTransactionClient> = {
    onDemandReport: {
      create: transactionMocks.onDemandReport.create,
    },
  };

  // Expected call
  const expectedCall = {
    data: { ...testInput },
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should insert using the provided transaction client", async () => {
    await insertOnDemandReport(testInput, mockTransaction as PrismaTransactionClient);

    expect(transactionMocks.onDemandReport.create).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
