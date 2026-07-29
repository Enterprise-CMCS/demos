import { describe, it, expect, vi } from "vitest";
import { personResolvers } from "./personResolvers";
import type { Person as PrismaPerson } from "@prisma/client";

// Mock imports
import type { ContextUser, GraphQLContext } from "../../auth";
import { getManyDemonstrationRoleAssignments } from "../demonstrationRoleAssignment";
import { setPersonStates } from "../personState";

vi.mock("../demonstrationRoleAssignment", () => ({
  getManyDemonstrationRoleAssignments: vi.fn(),
}));

const mockUser: Partial<ContextUser> = {};
const mockContext: Partial<GraphQLContext> = {
  user: mockUser as ContextUser,
};

describe("personResolvers", () => {
  describe("Mutation.setPersonStates", () => {
    it("delegates to setPersonStates", async () => {
      const testArgs = { personId: "personId", stateIds: ["stateId1", "stateId2"] };
      await personResolvers.Mutation.setPersonStates(null, testArgs);

      expect(setPersonStates).toHaveBeenCalledExactlyOnceWith(testArgs.personId, testArgs.stateIds);
    });
  });
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
