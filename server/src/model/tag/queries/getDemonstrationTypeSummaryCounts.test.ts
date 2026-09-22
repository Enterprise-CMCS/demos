// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { QueryResult } from "./getDemonstrationTypeSummaryCounts";

// Functions under test
import { getDemonstrationTypeSummaryCounts } from "./getDemonstrationTypeSummaryCounts";

// Mock imports
import { prisma } from "../../../prismaClient.js";

vi.mock("../../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

describe("getDemonstrationTypeSummaryCounts", () => {
  const mockPrismaClient = {
    $queryRaw: vi.fn(),
  };

  const mockResults: QueryResult[] = [
    {
      demonstration_type: "Type 1",
      status: "Approved",
      count_tagged_apps_demonstrations: 13,
      count_tagged_apps_amendments: 22,
      count_tagged_apps_extensions: 19,
      count_assigned_demonstrations: 4,
      count_assigned_deliverables: 45,
    },
    {
      demonstration_type: "Type 2",
      status: "Unapproved",
      count_tagged_apps_demonstrations: 5,
      count_tagged_apps_amendments: 8,
      count_tagged_apps_extensions: 13,
      count_assigned_demonstrations: 5,
      count_assigned_deliverables: 15,
    },
  ];

  beforeEach(() => {
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    vi.mocked(mockPrismaClient.$queryRaw).mockResolvedValue(mockResults);
  });

  it("should get data from the database and properly format it", async () => {
    const result = await getDemonstrationTypeSummaryCounts();

    expect(mockPrismaClient.$queryRaw).toHaveBeenCalledOnce();
    expect(result).toEqual([
      {
        demonstrationTypeName: "Type 1",
        approvalStatus: "Approved",
        countOfTaggedApplications: { demonstrations: 13, amendments: 22, renewals: 19 },
        countOfAssignedDemonstrations: 4,
        countOfAssignedDeliverables: 45,
      },
      {
        demonstrationTypeName: "Type 2",
        approvalStatus: "Unapproved",
        countOfTaggedApplications: { demonstrations: 5, amendments: 8, renewals: 13 },
        countOfAssignedDemonstrations: 5,
        countOfAssignedDeliverables: 15,
      },
    ]);
  });
});
