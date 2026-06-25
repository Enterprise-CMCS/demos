// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TZDate } from "@date-fns/tz";

// Types
import type { OnDemandReportType } from "../types";
import type { OnDemandReportConfiguration } from "./configs/onDemandReportConfigTypes";
import type { ReportMetadata } from "./formatOnDemandReportInExcel";

// Functions under test
import { formatOnDemandReportInExcel } from "./formatOnDemandReportInExcel";

// Mock imports
vi.mock("@cj-tech-master/excelts", () => ({
  Workbook: vi.fn(),
}));

vi.mock("./configs", () => ({
  getOnDemandReportConfiguration: vi.fn(),
}));

import { Workbook } from "@cj-tech-master/excelts";
import { getOnDemandReportConfiguration } from "./configs";

describe("formatOnDemandReportInExcel", () => {
  const testReportType: OnDemandReportType = "Basic Test Report";
  const testRows = [{ col1: "value" }];
  const testRequestId = "test-request-id";
  const testReportMetadata: ReportMetadata = {
    requestId: testRequestId,
    requestTimestamp: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2024, 7, 19, 20, 10, 55, 181, "America/New_York"),
    },
  };

  const mockWorkbook = {
    addWorksheet: vi.fn(),
    xlsx: { writeBuffer: vi.fn() },
  };
  const mockPrimaryWorksheet = {
    columns: [],
    addRow: vi.fn(),
    getRow: vi.fn(),
    autoFitColumns: vi.fn(),
  };
  const mockMetadataWorksheet = {
    addRow: vi.fn(),
    getColumn: vi.fn(),
    getRow: vi.fn(),
    autoFitColumns: vi.fn(),
  };
  const mockGetCell = vi.fn();
  const mockOnDemandReportConfiguration: Partial<OnDemandReportConfiguration> = {
    excelConfiguration: { columnNames: { col1: "Column 1" } },
  };
  let mockPrimaryHeaderRow: { font?: { bold: boolean } } = {};
  let mockMetadataLabelColumn: { font?: { bold: boolean } } = {};
  let mockMetadataValueColumn: { alignment?: { horizontal: string } } = {};
  let mockTimestampCell: { numFmt?: string } = {};
  const mockWrittenBuffer = new Uint8Array([1, 2, 3]);

  beforeEach(() => {
    vi.resetAllMocks();

    // Reset these before every test to ensure they are empty
    mockPrimaryWorksheet.columns = [];
    mockPrimaryHeaderRow = {};
    mockMetadataLabelColumn = {};
    mockMetadataValueColumn = {};
    mockTimestampCell = {};

    // as any used because mockWorkbook is a stand-in for a real excelTS Workbook
    vi.mocked(Workbook).mockImplementation(function () {
      return mockWorkbook as any;
    });

    // as any used because config just needs to have excelConfiguration
    // Generic accessor gets a specific config, but we don't care about that
    vi.mocked(getOnDemandReportConfiguration).mockReturnValue(
      mockOnDemandReportConfiguration as any
    );

    // The primary worksheet is created first, the metadata worksheet second
    mockWorkbook.addWorksheet
      .mockReturnValueOnce(mockPrimaryWorksheet)
      .mockReturnValueOnce(mockMetadataWorksheet);
    mockWorkbook.xlsx.writeBuffer.mockResolvedValue(mockWrittenBuffer);

    mockPrimaryWorksheet.getRow.mockReturnValue(mockPrimaryHeaderRow);

    // The label column is fetched first, the value column second
    mockMetadataWorksheet.getColumn
      .mockReturnValueOnce(mockMetadataLabelColumn)
      .mockReturnValueOnce(mockMetadataValueColumn);
    mockMetadataWorksheet.getRow.mockReturnValue({ getCell: mockGetCell });
    mockGetCell.mockReturnValue(mockTimestampCell);
  });

  it("adds a worksheet for the report and a metadata worksheet", async () => {
    await formatOnDemandReportInExcel(testReportType, testRows, testReportMetadata);

    expect(mockWorkbook.addWorksheet).toHaveBeenCalledTimes(2);
    expect(mockWorkbook.addWorksheet).toHaveBeenNthCalledWith(1, testReportType);
    expect(mockWorkbook.addWorksheet).toHaveBeenNthCalledWith(2, "Report Metadata");
  });

  it("sets the worksheet columns from the report's configured column names", async () => {
    await formatOnDemandReportInExcel(testReportType, testRows, testReportMetadata);

    expect(getOnDemandReportConfiguration).toHaveBeenCalledExactlyOnceWith(testReportType);
    expect(mockPrimaryWorksheet.columns).toEqual([{ key: "col1", header: "Column 1" }]);
  });

  it("adds a row for each report row", async () => {
    await formatOnDemandReportInExcel(testReportType, testRows, testReportMetadata);

    expect(mockPrimaryWorksheet.addRow).toHaveBeenCalledExactlyOnceWith({ col1: "value" });
  });

  it("bolds the header row", async () => {
    await formatOnDemandReportInExcel(testReportType, testRows, testReportMetadata);

    expect(mockPrimaryWorksheet.getRow).toHaveBeenCalledExactlyOnceWith(1);
    expect(mockPrimaryHeaderRow.font).toEqual({ bold: true });
  });

  it("auto-fits the columns of both worksheets to their content", async () => {
    await formatOnDemandReportInExcel(testReportType, testRows, testReportMetadata);

    expect(mockPrimaryWorksheet.autoFitColumns).toHaveBeenCalledExactlyOnceWith();
    expect(mockMetadataWorksheet.autoFitColumns).toHaveBeenCalledExactlyOnceWith();
  });

  it("adds the request ID to the metadata worksheet", async () => {
    await formatOnDemandReportInExcel(testReportType, testRows, testReportMetadata);

    expect(mockMetadataWorksheet.addRow).toHaveBeenNthCalledWith(1, ["Request Id", testRequestId]);
  });

  it("adds the request timestamp to the metadata worksheet as an ISO string", async () => {
    await formatOnDemandReportInExcel(testReportType, testRows, testReportMetadata);

    expect(mockMetadataWorksheet.addRow).toHaveBeenCalledTimes(2);
    expect(mockMetadataWorksheet.addRow).toHaveBeenNthCalledWith(2, [
      "Request Timestamp",
      testReportMetadata.requestTimestamp.easternTZDate.toISOString(),
    ]);
  });

  it("bolds the metadata label column", async () => {
    await formatOnDemandReportInExcel(testReportType, testRows, testReportMetadata);

    expect(mockMetadataWorksheet.getColumn).toHaveBeenCalledWith(1);
    expect(mockMetadataLabelColumn.font).toEqual({ bold: true });
  });

  it("right-aligns the metadata value column", async () => {
    await formatOnDemandReportInExcel(testReportType, testRows, testReportMetadata);

    expect(mockMetadataWorksheet.getColumn).toHaveBeenCalledWith(2);
    expect(mockMetadataValueColumn.alignment).toEqual({ horizontal: "right" });
  });

  it("formats the timestamp cell as text so Excel does not coerce it", async () => {
    await formatOnDemandReportInExcel(testReportType, testRows, testReportMetadata);

    expect(mockMetadataWorksheet.getRow).toHaveBeenCalledExactlyOnceWith(2);
    expect(mockGetCell).toHaveBeenCalledExactlyOnceWith(2);
    expect(mockTimestampCell.numFmt).toBe("@");
  });

  it("returns the written workbook buffer", async () => {
    const result = await formatOnDemandReportInExcel(testReportType, testRows, testReportMetadata);

    expect(mockWorkbook.xlsx.writeBuffer).toHaveBeenCalledExactlyOnceWith();
    expect(result).toEqual(Buffer.from(mockWrittenBuffer));
  });
});
