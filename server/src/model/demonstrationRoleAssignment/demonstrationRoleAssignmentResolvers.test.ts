import { describe, expect, it, vi } from "vitest";
import { demonstrationRoleAssigmentResolvers } from "./demonstrationRoleAssignmentResolvers";
import {
  DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment,
  Person as PrismaPerson,
} from "@prisma/client";
import { selectDemonstrationOrThrow } from "../demonstration/queries";
import type { GraphQLContext } from "../../auth";
import type { Loaders } from "../../loaders";

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

  it("delegates `DemonstrationRoleAssignment.person` to the personById loader", async () => {
    const person = { id: "person-1" } as PrismaPerson;
    const mockLoaders = {
      personById: { load: vi.fn() },
    } as unknown as Loaders;
    vi.mocked(mockLoaders.personById.load).mockResolvedValue(person);
    const mockContext = { loaders: mockLoaders } as unknown as GraphQLContext;

    const result = await demonstrationRoleAssigmentResolvers.DemonstrationRoleAssignment.person(
      { personId: "person-1" } as PrismaDemonstrationRoleAssignment,
      undefined,
      mockContext
    );

    expect(mockLoaders.personById.load).toHaveBeenCalledExactlyOnceWith("person-1");
    expect(result).toBe(person);
  });
});
