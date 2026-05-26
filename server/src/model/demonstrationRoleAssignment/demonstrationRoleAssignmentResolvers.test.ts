import { describe, expect, it, vi } from "vitest";
import { demonstrationRoleAssigmentResolvers } from "./demonstrationRoleAssignmentResolvers";
import { DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment } from "@prisma/client";
import { selectDemonstrationOrThrow } from "../demonstration/queries";

vi.mock("../demonstration/queries", () => ({
  selectDemonstrationOrThrow: vi.fn(),
}));

describe("demonstrationRoleAssignmentResolvers", () => {
  it("delegates `DemonstrationRoleAssignment.demonstration` to `Demonstration.getDemonstration`", async () => {
    await demonstrationRoleAssigmentResolvers.DemonstrationRoleAssignment.demonstration({
      demonstrationId: "abc123",
    } as PrismaDemonstrationRoleAssignment);
    expect(selectDemonstrationOrThrow).toHaveBeenCalledExactlyOnceWith({ id: "abc123" });
  });
});
