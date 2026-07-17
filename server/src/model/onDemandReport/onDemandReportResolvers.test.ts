// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TZDate } from "@date-fns/tz";
import { ZodError } from "zod";

// Types
import type { ContextUser, GraphQLContext } from "../../auth";
import type { OnDemandReportType } from "../../types";
import type { EasternNow } from "../../dateUtilities";

// Functions under test
import { onDemandReportResolvers } from "./onDemandReportResolvers";

// Mock imports
vi.mock("../../onDemandReports", () => ({
  runOnDemandReport: vi.fn(),
  formatOnDemandReportInExcel: vi.fn(),
}));

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("../../adapters", () => ({
  getS3Adapter: vi.fn(),
}));

vi.mock("./queries", () => ({
  insertOnDemandReport: vi.fn(),
}));

vi.mock("node:crypto", () => ({
  randomUUID: vi.fn(),
}));

const testCustomGQLError = new Error("Test throwCustomGQLError!");
vi.mock("../../errors/errorCodes", () => ({
  throwCustomGQLError: vi.fn(() => {
    throw testCustomGQLError;
  }),
}));

const testHandlePrismaError = new Error("Test handlePrismaError!");
vi.mock("../../errors/handlePrismaError", () => ({
  handlePrismaError: vi.fn(() => {
    throw testHandlePrismaError;
  }),
}));

vi.mock("../../log", () => ({
  log: {
    error: vi.fn(),
  },
}));

vi.mock("../../dateUtilities", () => ({
  getEasternNow: vi.fn(),
}));

vi.mock("./generateOnDemandReportFileName", () => ({
  generateOnDemandReportFileName: vi.fn(),
}));

import { runOnDemandReport, formatOnDemandReportInExcel } from "../../onDemandReports";
import { prisma } from "../../prismaClient";
import { getS3Adapter, S3Adapter } from "../../adapters";
import { insertOnDemandReport } from "./queries";
import { randomUUID } from "node:crypto";
import { throwCustomGQLError } from "../../errors/errorCodes";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { log } from "../../log";
import { getEasternNow } from "../../dateUtilities";
import { generateOnDemandReportFileName } from "./generateOnDemandReportFileName";

describe("onDemandReportResolvers", () => {
  const testContextUser: Partial<ContextUser> = { id: "user-123" };
  const testContext: GraphQLContext = { user: testContextUser as ContextUser };
  const testReportType: OnDemandReportType = "Basic Test Report";

  const mockEasternNow: Partial<EasternNow> = {
    "Current Time": {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2024, 7, 19, 20, 10, 55, 181, "America/New_York"),
    },
  };
  const mockReportId = "11111111-1111-1111-1111-111111111111";
  const mockS3Path = `s3://clean-bucket/reports/on-demand/${mockReportId}.xlsx`;
  const mockFormattedReport = Buffer.from("mock-excel-buffer");
  const mockTransaction = {} as any;
  const mockPrismaClient = {
    $transaction: vi.fn(),
  };
  const mockUploadOnDemandReport = vi.fn();
  const mockDeleteOnDemandReport = vi.fn();
  const mockGetPresignedDownloadUrl = vi.fn();
  const mockS3Adapter: Partial<S3Adapter> = {
    uploadOnDemandReport: mockUploadOnDemandReport,
    deleteOnDemandReport: mockDeleteOnDemandReport,
    getPresignedDownloadUrl: mockGetPresignedDownloadUrl,
  };
  const mockOnDemandReportFileName = "This is a mock string";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getEasternNow).mockReturnValue(mockEasternNow as EasternNow);
    vi.mocked(randomUUID).mockReturnValue(mockReportId);
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    vi.mocked(getS3Adapter).mockReturnValue(mockS3Adapter as S3Adapter);
    vi.mocked(runOnDemandReport).mockResolvedValue([]);
    vi.mocked(formatOnDemandReportInExcel).mockResolvedValue(mockFormattedReport);
    vi.mocked(mockUploadOnDemandReport).mockResolvedValue(mockS3Path);
    vi.mocked(mockDeleteOnDemandReport).mockResolvedValue(mockS3Path);
    vi.mocked(mockGetPresignedDownloadUrl).mockResolvedValue("https://presigned-download-url");
    vi.mocked(mockPrismaClient.$transaction).mockImplementation((callback) =>
      callback(mockTransaction)
    );
    vi.mocked(handlePrismaError).mockImplementation(() => {
      throw testHandlePrismaError;
    });
    vi.mocked(throwCustomGQLError).mockImplementation(() => {
      throw testCustomGQLError;
    });
    vi.mocked(generateOnDemandReportFileName).mockReturnValue(mockOnDemandReportFileName);
  });

  describe("Mutation.generateOnDemandReport", () => {
    it("generates a report, formats it, and returns a presigned download URL", async () => {
      const result = await onDemandReportResolvers.Mutation.generateOnDemandReport(
        undefined,
        { reportType: testReportType },
        testContext
      );

      expect(runOnDemandReport).toHaveBeenCalledExactlyOnceWith(testReportType, mockTransaction);
      expect(formatOnDemandReportInExcel).toHaveBeenCalledExactlyOnceWith(testReportType, [], {
        requestId: mockReportId,
        requestTimestamp: mockEasternNow["Current Time"],
      });
      expect(mockUploadOnDemandReport).toHaveBeenCalledExactlyOnceWith(
        mockReportId,
        mockFormattedReport
      );
      expect(insertOnDemandReport).toHaveBeenCalledExactlyOnceWith(
        {
          id: mockReportId,
          s3Path: mockS3Path,
          generatedFileName: mockOnDemandReportFileName + ".xlsx",
          requestingUserId: testContextUser.id,
          reportTypeId: testReportType,
          statusId: "Available",
          reportGeneratedAt: mockEasternNow["Current Time"]!.easternTZDate,
        },
        mockTransaction
      );
      expect(mockGetPresignedDownloadUrl).toHaveBeenCalledExactlyOnceWith(
        mockS3Path,
        mockOnDemandReportFileName,
        {
          disposition: "attachment",
        }
      );
      expect(mockDeleteOnDemandReport).not.toHaveBeenCalled();
      expect(result).toBe("https://presigned-download-url");
    });

    it("throws a custom GraphQL error when runOnDemandReport throws a ZodError", async () => {
      const zodError = new ZodError([]);
      vi.mocked(runOnDemandReport).mockRejectedValue(zodError);

      await expect(
        onDemandReportResolvers.Mutation.generateOnDemandReport(
          undefined,
          { reportType: testReportType },
          testContext
        )
      ).rejects.toThrow(testCustomGQLError);

      expect(log.error).toHaveBeenCalledTimes(1);
      expect(log.error).toHaveBeenCalledWith("Zod Validation Errors!\n");
      expect(throwCustomGQLError).toHaveBeenCalledExactlyOnceWith(
        `Running the on-demand ${testReportType} report caused a Zod validation error.`,
        "ON_DEMAND_REPORT_ZOD_ERROR"
      );
    });

    it("attempts to clean up the S3 resource when an error occurs", async () => {
      const zodError = new ZodError([]);
      vi.mocked(runOnDemandReport).mockRejectedValue(zodError);

      await expect(
        onDemandReportResolvers.Mutation.generateOnDemandReport(
          undefined,
          { reportType: testReportType },
          testContext
        )
      ).rejects.toThrow(testCustomGQLError);

      expect(mockDeleteOnDemandReport).toHaveBeenCalledExactlyOnceWith(mockReportId);
    });

    it("logs an error when the S3 cleanup itself fails", async () => {
      const zodError = new ZodError([]);
      const cleanupError = new Error("S3 cleanup failed");
      vi.mocked(runOnDemandReport).mockRejectedValue(zodError);
      vi.mocked(mockDeleteOnDemandReport).mockRejectedValue(cleanupError);

      await expect(
        onDemandReportResolvers.Mutation.generateOnDemandReport(
          undefined,
          { reportType: testReportType },
          testContext
        )
      ).rejects.toThrow(testCustomGQLError);

      expect(log.error).toHaveBeenCalledTimes(3);
      expect(log.error).toHaveBeenNthCalledWith(
        1,
        "s3Adapter.deleteOnDemandReport encountered an error while trying to clean up " +
          `after generating report with ID ${mockReportId} failed.`
      );
      expect(log.error).toHaveBeenNthCalledWith(2, cleanupError);
      expect(log.error).toHaveBeenNthCalledWith(3, "Zod Validation Errors!\n");
    });

    it("delegates non-ZodErrors to handlePrismaError", async () => {
      const originalError = new Error("unexpected database failure");
      vi.mocked(insertOnDemandReport).mockRejectedValue(originalError);

      await expect(
        onDemandReportResolvers.Mutation.generateOnDemandReport(
          undefined,
          { reportType: testReportType },
          testContext
        )
      ).rejects.toThrow(testHandlePrismaError);

      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(originalError);
    });
  });
});
