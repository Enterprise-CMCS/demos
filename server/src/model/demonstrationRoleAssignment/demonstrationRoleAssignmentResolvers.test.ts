import { beforeEach, describe, expect, it, vi } from "vitest";
import { demonstrationRoleAssigmentResolvers } from "./demonstrationRoleAssignmentResolvers";
import {
  Demonstration as PrismaDemonstration,
  DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment,
  Person as PrismaPerson,
} from "@prisma/client";
import type { GraphQLContext } from "../../auth";
import type { Loaders } from "../../loaders";
import { SetDemonstrationRoleInput } from "./demonstrationRoleAssignmentSchema";
import { validateSetDemonstrationRoleInput } from "./validateSetDemonstrationRoleInput";
import { selectPersonOrThrow } from "../person/queries";
import { selectDemonstrationOrThrow } from "../demonstration/queries";
import { selectDemonstrationRoleAssignmentOrThrow } from "./queries/selectDemonstrationRoleAssignmentOrThrow";
import { DemonstrationRoleAssignmentQueryResult } from "./queries";

vi.mock("./validateSetDemonstrationRoleInput", () => ({
  validateSetDemonstrationRoleInput: vi.fn(),
}));

vi.mock("../person/queries/selectPersonOrThrow", () => ({
  selectPersonOrThrow: vi.fn(),
}));

vi.mock("../demonstration/queries", () => ({
  selectDemonstrationOrThrow: vi.fn(),
}));

vi.mock("./queries/selectDemonstrationRoleAssignmentOrThrow", () => ({
  selectDemonstrationRoleAssignmentOrThrow: vi.fn(),
}));

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(() => ({
    $transaction: vi.fn((callback) => callback(mockPrismaTransaction)),
  })),
}));

const mockPrismaTransaction = {
  demonstrationRoleAssignment: {
    upsert: vi.fn(),
  },
  primaryDemonstrationRoleAssignment: {
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
};

describe("demonstrationRoleAssignmentResolvers", () => {
  const mockLoaders = {
    demonstrationById: { load: vi.fn() },
    personById: { load: vi.fn() },
  } as unknown as Loaders;

  const mockContext = { loaders: mockLoaders } as unknown as GraphQLContext;

  const mockPerson: PrismaPerson = {
    id: "person-1",
    personTypeId: "demos-cms-user",
  } as PrismaPerson;

  const mockDemonstration: PrismaDemonstration = {
    id: "demonstration-1",
    stateId: "CA",
  } as PrismaDemonstration;

  const mockRoleAssignment: DemonstrationRoleAssignmentQueryResult = {
    personId: "person-1",
    demonstrationId: "demonstration-1",
    roleId: "DDME Analyst",
    isPrimary: true,
  } as DemonstrationRoleAssignmentQueryResult;

  beforeEach(() => {
    vi.resetAllMocks();

    // Set up default mock implementations
    vi.mocked(selectPersonOrThrow).mockResolvedValue(mockPerson);
    vi.mocked(selectDemonstrationOrThrow).mockResolvedValue(mockDemonstration);
    vi.mocked(selectDemonstrationRoleAssignmentOrThrow).mockResolvedValue(mockRoleAssignment);
  });

  describe("Mutation.setDemonstrationRoles", () => {
    it("validates each input using validateSetDemonstrationRoleInput", async () => {
      const input: SetDemonstrationRoleInput[] = [
        {
          demonstrationId: "demo-1",
          personId: "person-1",
          roleId: "DDME Analyst",
          isPrimary: true,
        },
        {
          demonstrationId: "demo-1",
          personId: "person-2",
          roleId: "Project Officer",
          isPrimary: false,
        },
      ];

      await demonstrationRoleAssigmentResolvers.Mutation.setDemonstrationRoles(null, { input });

      expect(validateSetDemonstrationRoleInput).toHaveBeenNthCalledWith(1, input[0], expect.any(Object));
      expect(validateSetDemonstrationRoleInput).toHaveBeenNthCalledWith(2, input[1], expect.any(Object));
    });
  });

  describe("Mutation.setDemonstrationRole", () => {
    it("validates the input using validateSetDemonstrationRoleInput", async () => {
      const input: SetDemonstrationRoleInput = {
        demonstrationId: "demo-1",
        personId: "person-1",
        roleId: "DDME Analyst",
        isPrimary: true,
      };

      await demonstrationRoleAssigmentResolvers.Mutation.setDemonstrationRole(null, { input });

      expect(validateSetDemonstrationRoleInput).toHaveBeenCalledWith(input, expect.any(Object));
    });
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
