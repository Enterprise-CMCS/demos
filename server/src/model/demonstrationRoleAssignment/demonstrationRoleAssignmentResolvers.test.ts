import { describe, expect, it, vi } from "vitest";
import { demonstrationRoleAssigmentResolvers } from "./demonstrationRoleAssignmentResolvers";
import { DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment } from "@prisma/client";
import { getDemonstration } from "../demonstration";
import { ContextUser } from "../../auth";

const mockUser = {} as unknown as ContextUser;
const mockContext = {
  user: mockUser,
};

vi.mock("../demonstration", () => ({
  getDemonstration: vi.fn(),
}));

describe("demonstrationRoleAssignmentResolvers", () => {
  it("delegates `DemonstrationRoleAssignment.demonstration` to `Demonstration.getDemonstration`", async () => {
    await demonstrationRoleAssigmentResolvers.DemonstrationRoleAssignment.demonstration(
      { demonstrationId: "abc123" } as PrismaDemonstrationRoleAssignment,
      {},
      mockContext
    );
    expect(getDemonstration).toHaveBeenCalledExactlyOnceWith({ id: "abc123" }, mockUser);
  });
});
