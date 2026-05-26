import { describe, it, expect, vi } from "vitest";
import { personResolvers } from "./personResolvers";
import { Person as PrismaPerson } from "@prisma/client";

// Mock imports
import { selectManyDemonstrationRoleAssignments } from "../demonstrationRoleAssignment/queries";

vi.mock("../demonstrationRoleAssignment/queries", () => ({
  selectManyDemonstrationRoleAssignments: vi.fn(),
}));

describe("applicationPhaseResolvers", () => {
  describe("Person.roles", () => {
    it("delegates to demonstrationRoleAssignmentData/queries.selectManyDemonstrationRoleAssignments", async () => {
      await personResolvers.Person.roles({ id: "personId" } as PrismaPerson);
      expect(selectManyDemonstrationRoleAssignments).toHaveBeenCalledExactlyOnceWith({
        personId: "personId",
      });
    });
  });
});
