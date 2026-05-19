import { describe, expect, it, vi } from "vitest";
import { demonstrationRoleAssigmentResolvers } from "./demonstrationRoleAssignmentResolvers";
import { DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment } from "@prisma/client";
import { selectDemonstrationOrThrow } from "../demonstration";
import { ContextUser } from "../../auth/userContext";

const mockUser = {} as unknown as ContextUser;
const mockContext = {
  user: mockUser,
};

vi.mock("../demonstration", () => ({
  selectDemonstrationOrThrow: vi.fn(),
}));

describe("demonstrationRoleAssignmentResolvers", () => {
  it("delegates `DemonstrationRoleAssignment.demonstration` to `Demonstration.selectDemonstrationOrThrow`", async () => {
    await demonstrationRoleAssigmentResolvers.DemonstrationRoleAssignment.demonstration({
      demonstrationId: "abc123",
    } as PrismaDemonstrationRoleAssignment);
    expect(selectDemonstrationOrThrow).toHaveBeenCalledExactlyOnceWith({ id: "abc123" });
  });
});
