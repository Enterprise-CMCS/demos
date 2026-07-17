import { describe, it, expect, vi } from "vitest";
import { personResolvers } from "./personResolvers";
import { Person as PrismaPerson } from "@prisma/client";

// Mock imports
import { ContextUser, GraphQLContext } from "../../auth";
import { getManyDemonstrationRoleAssignments } from "../demonstrationRoleAssignment";

vi.mock("../demonstrationRoleAssignment", () => ({
  getManyDemonstrationRoleAssignments: vi.fn(),
}));

const mockUser = {} as unknown as ContextUser;
const mockContext: GraphQLContext = {
  user: mockUser,
};

describe("applicationPhaseResolvers", () => {
  describe("Person.roles", () => {
    it("delegates to demonstrationRoleAssignmentData/queries.selectManyDemonstrationRoleAssignments", async () => {
      await personResolvers.Person.roles(
        { id: "personId" } as PrismaPerson,
        undefined,
        mockContext
      );
      expect(getManyDemonstrationRoleAssignments).toHaveBeenCalledExactlyOnceWith(
        { personId: "personId" },
        mockUser
      );
    });
  });
});
