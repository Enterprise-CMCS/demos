// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { PrismaTransactionClient } from "../prismaClient";

// Functions under test
import { runOnDemandReport } from "./runOnDemandReport";

// Mock imports
vi.mock("./onDemandReportConfigurations", () => ({
  ON_DEMAND_REPORT_CONFIGURATIONS: {
    "Basic Test Report": {
      sqlQuery: "SELECT 1",
      reportRowSchema: { _isMockSchema: true },
    },
  },
}));

vi.mock("zod", () => ({
  z: { array: vi.fn() },
}));

import { z } from "zod";
import { ON_DEMAND_REPORT_CONFIGURATIONS } from "./onDemandReportConfigurations";

describe("runOnDemandReport", () => {
  const mockQueryRawUnsafe = vi.fn();
  const mockTx: Partial<PrismaTransactionClient> = { $queryRawUnsafe: mockQueryRawUnsafe };
  const mockParse = vi.fn();
  const mockZodArray: Partial<z.ZodArray<z.ZodType>> = { parse: mockParse };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(z.array).mockReturnValue(mockZodArray as z.ZodArray<z.ZodType>);
    mockQueryRawUnsafe.mockResolvedValue([{ some: "data" }]);
  });

  it("executes the sqlQuery from the configuration against the transaction client", async () => {
    await runOnDemandReport("Basic Test Report", mockTx as PrismaTransactionClient);

    expect(mockTx.$queryRawUnsafe).toHaveBeenCalledExactlyOnceWith("SELECT 1");
  });

  it("passes the report schema and query results to zod for parsing", async () => {
    await runOnDemandReport("Basic Test Report", mockTx as PrismaTransactionClient);

    expect(z.array).toHaveBeenCalledWith(
      ON_DEMAND_REPORT_CONFIGURATIONS["Basic Test Report"].reportRowSchema
    );
    expect(mockParse).toHaveBeenCalledExactlyOnceWith([{ some: "data" }]);
  });
});
