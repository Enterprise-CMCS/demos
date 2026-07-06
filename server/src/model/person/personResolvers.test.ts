import { describe, it, expect, vi } from "vitest";
import { personResolvers } from "./personResolvers";
import { Person as PrismaPerson } from "@prisma/client";

// Mock imports
import { ContextUser, GraphQLContext } from "../../auth";
import { getManyDemonstrationRoleAssignments } from "../demonstrationRoleAssignment";
import { setPersonStates } from "../personState";

vi.mock("../demonstrationRoleAssignment", () => ({
  getManyDemonstrationRoleAssignments: vi.fn(),
}));

vi.mock("../personState", () => ({
  setPersonStates: vi.fn(),
}));

const mockUser = {} as unknown as ContextUser;
const mockContext: GraphQLContext = {
  user: mockUser,
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
        mockContext
      );
      expect(getManyDemonstrationRoleAssignments).toHaveBeenCalledExactlyOnceWith(
        { personId: "personId" },
        mockUser
      );
    });
  });
});
