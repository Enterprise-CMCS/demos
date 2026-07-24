import { describe, it, expect, vi } from "vitest";
import { personResolvers } from "./personResolvers";
import { Person as PrismaPerson } from "@prisma/client";

// Mock imports
import { ContextUser, GraphQLContext } from "../../auth";
import { getManyDemonstrationRoleAssignments } from "../demonstrationRoleAssignment";

vi.mock("../demonstrationRoleAssignment", () => ({
  getManyDemonstrationRoleAssignments: vi.fn(),
}));

const mockUser: Partial<ContextUser> = {};
const mockContext: Partial<GraphQLContext> = {
  user: mockUser as ContextUser,
};

describe("applicationPhaseResolvers", () => {
  describe("Person.roles", () => {
    it("delegates to demonstrationRoleAssignmentData/queries.selectManyDemonstrationRoleAssignments", async () => {
      await personResolvers.Person.roles(
        { id: "personId" } as PrismaPerson,
        undefined,
        mockContext as GraphQLContext
      );
      expect(getManyDemonstrationRoleAssignments).toHaveBeenCalledExactlyOnceWith(
        { personId: "personId" },
        mockUser
      );
    });
  });
});
