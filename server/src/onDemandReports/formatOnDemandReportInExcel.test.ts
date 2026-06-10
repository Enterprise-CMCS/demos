// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import { OnDemandReportType } from "../types";
import { OnDemandReportConfiguration } from "./configs/onDemandReportConfigTypes";

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

  const mockWorkbook = {
    addWorksheet: vi.fn(),
    xlsx: { writeBuffer: vi.fn() },
  };
  const mockWorksheet = {
    columns: [],
    addRow: vi.fn(),
    getRow: vi.fn(),
    autoFitColumns: vi.fn(),
  };
  const mockOnDemandReportConfiguration: Partial<OnDemandReportConfiguration> = {
    excelConfiguration: { columnNames: { col1: "Column 1" } },
  };
  let mockHeaderRow: { font?: { bold: boolean } } = {};
  const mockWrittenBuffer = new Uint8Array([1, 2, 3]);

  beforeEach(() => {
    vi.resetAllMocks();

    // Reset these before every test to ensure they are empty
    mockWorksheet.columns = [];
    mockHeaderRow = {};

    // as any used because mockWorkbook is a stand-in for a real excelTS Workbook
    vi.mocked(Workbook).mockImplementation(function () {
      return mockWorkbook as any;
    });

    // as any used because config just needs to have excelConfiguration
    // Generic accessor gets a specific config, but we don't care about that
    vi.mocked(getOnDemandReportConfiguration).mockReturnValue(
      mockOnDemandReportConfiguration as any
    );

    mockWorkbook.addWorksheet.mockReturnValue(mockWorksheet);
    mockWorkbook.xlsx.writeBuffer.mockResolvedValue(mockWrittenBuffer);
    mockWorksheet.getRow.mockReturnValue(mockHeaderRow);
  });

  it("adds a worksheet named after the report type", async () => {
    await formatOnDemandReportInExcel(testReportType, testRows);

    expect(mockWorkbook.addWorksheet).toHaveBeenCalledExactlyOnceWith(testReportType);
  });

  it("sets the worksheet columns from the report's configured column names", async () => {
    await formatOnDemandReportInExcel(testReportType, testRows);

    expect(getOnDemandReportConfiguration).toHaveBeenCalledExactlyOnceWith(testReportType);
    expect(mockWorksheet.columns).toEqual([{ key: "col1", header: "Column 1" }]);
  });

  it("adds a row for each report row", async () => {
    await formatOnDemandReportInExcel(testReportType, testRows);

    expect(mockWorksheet.addRow).toHaveBeenCalledExactlyOnceWith({ col1: "value" });
  });

  it("bolds the header row", async () => {
    await formatOnDemandReportInExcel(testReportType, testRows);

    expect(mockWorksheet.getRow).toHaveBeenCalledExactlyOnceWith(1);
    expect(mockHeaderRow.font).toEqual({ bold: true });
  });

  it("auto-fits the columns to their content", async () => {
    await formatOnDemandReportInExcel(testReportType, testRows);

    expect(mockWorksheet.autoFitColumns).toHaveBeenCalledExactlyOnceWith();
  });

  it("returns the written workbook buffer", async () => {
    const result = await formatOnDemandReportInExcel(testReportType, testRows);

    expect(mockWorkbook.xlsx.writeBuffer).toHaveBeenCalledExactlyOnceWith();
    expect(result).toEqual(Buffer.from(mockWrittenBuffer));
  });
});
