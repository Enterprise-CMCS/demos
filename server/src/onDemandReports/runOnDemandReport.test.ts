// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { prisma } from "../prismaClient";

// Functions under test
import { runOnDemandReport } from "./runOnDemandReport";

// Mock imports
vi.mock("fs", () => ({
  readFileSync: vi.fn(),
}));

vi.mock("./onDemandReportConfigurations", () => ({
  ON_DEMAND_REPORT_CONFIGURATIONS: {
    "Basic Test Report": {
      queryFile: "basicTestReport.sql",
      reportRowSchema: { _isMockSchema: true },
    },
  },
}));

vi.mock("zod", () => ({
  z: { array: vi.fn() },
}));

import { readFileSync } from "fs";
import { z } from "zod";
import { ON_DEMAND_REPORT_CONFIGURATIONS } from "./onDemandReportConfigurations";

describe("runOnDemandReport", () => {
  const mockQueryRawUnsafe = vi.fn();
  const mockClient: Partial<ReturnType<typeof prisma>> = { $queryRawUnsafe: mockQueryRawUnsafe };
  const mockParse = vi.fn();
  const mockZodArray: Partial<z.ZodArray<z.ZodTypeAny>> = { parse: mockParse };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(readFileSync).mockReturnValue("SELECT 1");
    vi.mocked(z.array).mockReturnValue(mockZodArray as z.ZodArray<z.ZodTypeAny>);
    mockQueryRawUnsafe.mockResolvedValue([{ some: "data" }]);
    mockParse.mockReturnValue([]);
  });

  it("reads the SQL file for the given report type", async () => {
    await runOnDemandReport("Basic Test Report", mockClient as ReturnType<typeof prisma>);

    expect(readFileSync).toHaveBeenCalledWith(
      expect.stringContaining("basicTestReport.sql"),
      "utf-8"
    );
  });

  it("executes the SQL from the query file against the client", async () => {
    await runOnDemandReport("Basic Test Report", mockClient as ReturnType<typeof prisma>);

    expect(mockClient.$queryRawUnsafe).toHaveBeenCalledExactlyOnceWith("SELECT 1");
  });

  it("passes the report schema and query results to zod for parsing", async () => {
    await runOnDemandReport("Basic Test Report", mockClient as ReturnType<typeof prisma>);

    expect(z.array).toHaveBeenCalledWith(
      ON_DEMAND_REPORT_CONFIGURATIONS["Basic Test Report"].reportRowSchema
    );
    expect(mockParse).toHaveBeenCalledExactlyOnceWith([{ some: "data" }]);
  });
});
