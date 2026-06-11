// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { PrismaTransactionClient } from "../prismaClient";
import { OnDemandReportConfiguration } from "./configs/onDemandReportConfigTypes";

// Functions under test
import { runOnDemandReport } from "./runOnDemandReport";

// Mock imports
vi.mock("./configs", () => ({
  getOnDemandReportConfiguration: vi.fn(),
}));

vi.mock("zod", () => ({
  z: { array: vi.fn() },
}));

import { z } from "zod";
import { getOnDemandReportConfiguration } from "./configs";

describe("runOnDemandReport", () => {
  const mockQueryRawUnsafe = vi.fn();
  const mockZodArray = { parse: vi.fn() };
  const mockTx: Partial<PrismaTransactionClient> = { $queryRawUnsafe: mockQueryRawUnsafe };

  // Using as any here; we don't need a valid Zod schema, just a payload to test
  const mockOnDemandReportConfiguration: OnDemandReportConfiguration = {
    sqlQuery: "SELECT 1 as column1",
    reportRowSchema: "Foo" as any,
    excelConfiguration: { columnNames: { column1: "Column 1" } },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // Using as any here: the generic accessor returns a specific report's config
    // However, for testing, we just care that the report config is a valid config shape (confirmed above)
    vi.mocked(getOnDemandReportConfiguration).mockReturnValue(
      mockOnDemandReportConfiguration as any
    );
    // Using as any here; just need to test the calls to what Zod returns, no Zod typing needed
    vi.mocked(z.array).mockReturnValue(mockZodArray as any);
    mockQueryRawUnsafe.mockResolvedValue([{ some: "data" }]);
  });

  it("executes the sqlQuery from the configuration against the transaction client", async () => {
    await runOnDemandReport("Basic Test Report", mockTx as PrismaTransactionClient);

    expect(getOnDemandReportConfiguration).toHaveBeenCalledExactlyOnceWith("Basic Test Report");
    expect(mockTx.$queryRawUnsafe).toHaveBeenCalledExactlyOnceWith(
      mockOnDemandReportConfiguration.sqlQuery
    );
  });

  it("passes the report schema and query results to zod for parsing", async () => {
    await runOnDemandReport("Basic Test Report", mockTx as PrismaTransactionClient);

    expect(z.array).toHaveBeenCalledWith(mockOnDemandReportConfiguration.reportRowSchema);
    expect(mockZodArray.parse).toHaveBeenCalledExactlyOnceWith([{ some: "data" }]);
  });
});
