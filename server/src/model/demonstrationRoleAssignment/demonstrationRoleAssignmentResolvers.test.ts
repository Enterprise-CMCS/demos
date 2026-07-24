import { beforeEach, describe, expect, it, vi } from "vitest";
import { demonstrationRoleAssigmentResolvers } from "./demonstrationRoleAssignmentResolvers";
import {
  Demonstration as PrismaDemonstration,
  DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment,
  Person as PrismaPerson,
} from "@prisma/client";
import type { GraphQLContext } from "../../auth";
import type { Loaders } from "../../loaders";

describe("demonstrationRoleAssignmentResolvers", () => {
  const mockLoaders = {
    demonstrationById: { load: vi.fn() },
    personById: { load: vi.fn() },
  } as unknown as Loaders;
  const mockContext = { loaders: mockLoaders } as unknown as GraphQLContext;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("delegates `DemonstrationRoleAssignment.demonstration` to the demonstrationById loader", async () => {
    const demonstration = { id: "abc123" } as PrismaDemonstration;
    vi.mocked(mockLoaders.demonstrationById.load).mockResolvedValue(demonstration);

    const result =
      await demonstrationRoleAssigmentResolvers.DemonstrationRoleAssignment.demonstration(
        { demonstrationId: "abc123" } as PrismaDemonstrationRoleAssignment,
        undefined,
        mockContext
      );

    expect(mockLoaders.demonstrationById.load).toHaveBeenCalledExactlyOnceWith("abc123");
    expect(result).toBe(demonstration);
  });

  it("delegates `DemonstrationRoleAssignment.person` to the personById loader", async () => {
    const person = { id: "person-1" } as PrismaPerson;
    vi.mocked(mockLoaders.personById.load).mockResolvedValue(person);

    const result = await demonstrationRoleAssigmentResolvers.DemonstrationRoleAssignment.person(
      { personId: "person-1" } as PrismaDemonstrationRoleAssignment,
      undefined,
      mockContext
    );

    expect(mockLoaders.personById.load).toHaveBeenCalledExactlyOnceWith("person-1");
    expect(result).toBe(person);
  });
});
