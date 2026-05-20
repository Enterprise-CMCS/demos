import { describe, it, expect, vi, beforeEach } from "vitest";
import { selectDemonstrationRoleAssignment } from "./selectDemonstrationRoleAssignment";

// Mock imports
import { DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment } from "@prisma/client";
import { selectDemonstrationRoleAssignmentOrThrow } from "./selectDemonstrationRoleAssignmentOrThrow";
import { DemonstrationRoleAssignmentQueryResult } from ".";

vi.mock("./selectDemonstrationRoleAssignment", () => ({
  selectDemonstrationRoleAssignment: vi.fn(),
}));

describe("selectDemonstrationRoleAssignmentOrThrow", () => {
  it("should throw an error if no demonstrationRoleAssignment is found", async () => {
    vi.mocked(selectDemonstrationRoleAssignment).mockResolvedValue(null);
    await expect(
      selectDemonstrationRoleAssignmentOrThrow({ demonstrationId: "nonexistent-id" })
    ).rejects.toThrow("No demonstrationRoleAssignment found matching the provided filter");
  });
  it("should return the demonstrationRoleAssignment if one is found", async () => {
    const mockDemonstrationRoleAssignment = {
      personId: "existing-id",
      demonstrationId: "Upcoming",
    } as DemonstrationRoleAssignmentQueryResult;
    vi.mocked(selectDemonstrationRoleAssignment).mockResolvedValue(mockDemonstrationRoleAssignment);
    const result = await selectDemonstrationRoleAssignmentOrThrow({ personId: "existing-id" });
    expect(result).toEqual(mockDemonstrationRoleAssignment);
  });
});
