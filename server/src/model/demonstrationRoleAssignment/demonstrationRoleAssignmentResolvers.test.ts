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
    demonstrationId: "demo-1",
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
    const testInput: SetDemonstrationRoleInput[] = [
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

    const mockPerson2: PrismaPerson = {
      id: "person-2",
      personTypeId: "demos-cms-user",
    } as PrismaPerson;

    const mockRoleAssignment2: DemonstrationRoleAssignmentQueryResult = {
      personId: "person-2",
      demonstrationId: "demo-1",
      roleId: "Project Officer",
      isPrimary: false,
    } as DemonstrationRoleAssignmentQueryResult;

    beforeEach(() => {
      // Set up mock returns for multiple inputs
      vi.mocked(selectPersonOrThrow)
        .mockResolvedValueOnce(mockPerson)
        .mockResolvedValueOnce(mockPerson2);

      vi.mocked(selectDemonstrationRoleAssignmentOrThrow)
        .mockResolvedValueOnce(mockRoleAssignment)
        .mockResolvedValueOnce(mockRoleAssignment2);
    });

    it("validates each input using validateSetDemonstrationRoleInput within a transaction", async () => {
      await demonstrationRoleAssigmentResolvers.Mutation.setDemonstrationRoles(null, {
        input: testInput,
      });

      expect(validateSetDemonstrationRoleInput).toHaveBeenNthCalledWith(
        1,
        testInput[0],
        mockPrismaTransaction
      );
      expect(validateSetDemonstrationRoleInput).toHaveBeenNthCalledWith(
        2,
        testInput[1],
        mockPrismaTransaction
      );
    });

    it("fetches person for each input using selectPersonOrThrow within a transaction", async () => {
      await demonstrationRoleAssigmentResolvers.Mutation.setDemonstrationRoles(null, {
        input: testInput,
      });

      expect(selectPersonOrThrow).toHaveBeenNthCalledWith(
        1,
        { id: testInput[0].personId },
        mockPrismaTransaction
      );
      expect(selectPersonOrThrow).toHaveBeenNthCalledWith(
        2,
        { id: testInput[1].personId },
        mockPrismaTransaction
      );
    });

    it("fetches demonstration for each input using selectDemonstrationOrThrow within a transaction", async () => {
      await demonstrationRoleAssigmentResolvers.Mutation.setDemonstrationRoles(null, {
        input: testInput,
      });

      expect(selectDemonstrationOrThrow).toHaveBeenNthCalledWith(
        1,
        { id: testInput[0].demonstrationId },
        mockPrismaTransaction
      );
      expect(selectDemonstrationOrThrow).toHaveBeenNthCalledWith(
        2,
        { id: testInput[1].demonstrationId },
        mockPrismaTransaction
      );
    });

    it("upserts demonstrationRoleAssignment for each input within a transaction", async () => {
      await demonstrationRoleAssigmentResolvers.Mutation.setDemonstrationRoles(null, {
        input: testInput,
      });

      expect(mockPrismaTransaction.demonstrationRoleAssignment.upsert).toHaveBeenNthCalledWith(1, {
        where: {
          personId_demonstrationId_roleId: {
            personId: mockPerson.id,
            demonstrationId: mockDemonstration.id,
            roleId: testInput[0].roleId,
          },
        },
        update: {},
        create: {
          roleId: testInput[0].roleId,
          demonstrationId: mockDemonstration.id,
          stateId: mockDemonstration.stateId,
          personId: mockPerson.id,
          personTypeId: mockPerson.personTypeId,
          grantLevelId: "Demonstration",
        },
      });

      expect(mockPrismaTransaction.demonstrationRoleAssignment.upsert).toHaveBeenNthCalledWith(2, {
        where: {
          personId_demonstrationId_roleId: {
            personId: mockPerson2.id,
            demonstrationId: mockDemonstration.id,
            roleId: testInput[1].roleId,
          },
        },
        update: {},
        create: {
          roleId: testInput[1].roleId,
          demonstrationId: mockDemonstration.id,
          stateId: mockDemonstration.stateId,
          personId: mockPerson2.id,
          personTypeId: mockPerson2.personTypeId,
          grantLevelId: "Demonstration",
        },
      });
    });

    it("upserts primaryDemonstrationRoleAssignment when isPrimary is true", async () => {
      await demonstrationRoleAssigmentResolvers.Mutation.setDemonstrationRoles(null, {
        input: testInput,
      });

      expect(
        mockPrismaTransaction.primaryDemonstrationRoleAssignment.upsert
      ).toHaveBeenNthCalledWith(1, {
        where: {
          demonstrationId_roleId: {
            demonstrationId: mockDemonstration.id,
            roleId: testInput[0].roleId,
          },
        },
        update: {
          personId: mockPerson.id,
          personTypeId: mockPerson.personTypeId,
        },
        create: {
          demonstrationId: mockDemonstration.id,
          personId: mockPerson.id,
          roleId: testInput[0].roleId,
          personTypeId: mockPerson.personTypeId,
        },
      });
    });

    it("deletes primaryDemonstrationRoleAssignment when isPrimary is false", async () => {
      await demonstrationRoleAssigmentResolvers.Mutation.setDemonstrationRoles(null, {
        input: testInput,
      });

      expect(
        mockPrismaTransaction.primaryDemonstrationRoleAssignment.deleteMany
      ).toHaveBeenNthCalledWith(1, {
        where: {
          demonstrationId: mockDemonstration.id,
          roleId: testInput[1].roleId,
          personId: mockPerson2.id,
        },
      });
    });

    it("fetches and returns role assignments for each input", async () => {
      const result = await demonstrationRoleAssigmentResolvers.Mutation.setDemonstrationRoles(
        null,
        { input: testInput }
      );

      expect(selectDemonstrationRoleAssignmentOrThrow).toHaveBeenNthCalledWith(
        1,
        {
          personId: testInput[0].personId,
          demonstrationId: testInput[0].demonstrationId,
          roleId: testInput[0].roleId,
        },
        mockPrismaTransaction
      );
      expect(selectDemonstrationRoleAssignmentOrThrow).toHaveBeenNthCalledWith(
        2,
        {
          personId: testInput[1].personId,
          demonstrationId: testInput[1].demonstrationId,
          roleId: testInput[1].roleId,
        },
        mockPrismaTransaction
      );
      expect(result).toEqual([mockRoleAssignment, mockRoleAssignment2]);
    });
  });

  describe("Mutation.setDemonstrationRole", () => {
    const testInput: SetDemonstrationRoleInput = {
      demonstrationId: "demo-1",
      personId: "person-1",
      roleId: "DDME Analyst",
      isPrimary: true,
    };

    it("validates the input using validateSetDemonstrationRoleInput within a transaction", async () => {
      await demonstrationRoleAssigmentResolvers.Mutation.setDemonstrationRole(null, {
        input: testInput,
      });

      expect(validateSetDemonstrationRoleInput).toHaveBeenCalledExactlyOnceWith(
        testInput,
        mockPrismaTransaction
      );
    });

    it("fetches the person using selectPersonOrThrow within a transaction", async () => {
      await demonstrationRoleAssigmentResolvers.Mutation.setDemonstrationRole(null, {
        input: testInput,
      });

      expect(selectPersonOrThrow).toHaveBeenCalledExactlyOnceWith(
        { id: testInput.personId },
        mockPrismaTransaction
      );
    });

    it("fetches the demonstration using selectDemonstrationOrThrow within a transaction", async () => {
      await demonstrationRoleAssigmentResolvers.Mutation.setDemonstrationRole(null, {
        input: testInput,
      });

      expect(selectDemonstrationOrThrow).toHaveBeenCalledExactlyOnceWith(
        { id: testInput.demonstrationId },
        mockPrismaTransaction
      );
    });

    it("upserts demonstrationRoleAssignment with correct data within a transaction", async () => {
      await demonstrationRoleAssigmentResolvers.Mutation.setDemonstrationRole(null, {
        input: testInput,
      });

      expect(
        mockPrismaTransaction.demonstrationRoleAssignment.upsert
      ).toHaveBeenCalledExactlyOnceWith({
        where: {
          personId_demonstrationId_roleId: {
            personId: mockPerson.id,
            demonstrationId: mockDemonstration.id,
            roleId: testInput.roleId,
          },
        },
        update: {},
        create: {
          roleId: testInput.roleId,
          demonstrationId: mockDemonstration.id,
          stateId: mockDemonstration.stateId,
          personId: mockPerson.id,
          personTypeId: mockPerson.personTypeId,
          grantLevelId: "Demonstration",
        },
      });
    });

    it("upserts primaryDemonstrationRoleAssignment when isPrimary is true", async () => {
      await demonstrationRoleAssigmentResolvers.Mutation.setDemonstrationRole(null, {
        input: testInput,
      });

      expect(
        mockPrismaTransaction.primaryDemonstrationRoleAssignment.upsert
      ).toHaveBeenCalledExactlyOnceWith({
        where: {
          demonstrationId_roleId: {
            demonstrationId: mockDemonstration.id,
            roleId: testInput.roleId,
          },
        },
        update: {
          personId: mockPerson.id,
          personTypeId: mockPerson.personTypeId,
        },
        create: {
          demonstrationId: mockDemonstration.id,
          personId: mockPerson.id,
          roleId: testInput.roleId,
          personTypeId: mockPerson.personTypeId,
        },
      });
    });

    it("deletes primaryDemonstrationRoleAssignment when isPrimary is false", async () => {
      const inputWithPrimaryFalse: SetDemonstrationRoleInput = {
        ...testInput,
        isPrimary: false,
      };

      await demonstrationRoleAssigmentResolvers.Mutation.setDemonstrationRole(null, {
        input: inputWithPrimaryFalse,
      });

      expect(
        mockPrismaTransaction.primaryDemonstrationRoleAssignment.deleteMany
      ).toHaveBeenCalledExactlyOnceWith({
        where: {
          demonstrationId: mockDemonstration.id,
          roleId: testInput.roleId,
          personId: mockPerson.id,
        },
      });
    });

    it("does not modify primaryDemonstrationRoleAssignment when isPrimary is undefined", async () => {
      const inputWithoutPrimary: SetDemonstrationRoleInput = {
        demonstrationId: "demo-1",
        personId: "person-1",
        roleId: "DDME Analyst",
      };

      await demonstrationRoleAssigmentResolvers.Mutation.setDemonstrationRole(null, {
        input: inputWithoutPrimary,
      });

      expect(
        mockPrismaTransaction.primaryDemonstrationRoleAssignment.upsert
      ).not.toHaveBeenCalled();
      expect(
        mockPrismaTransaction.primaryDemonstrationRoleAssignment.deleteMany
      ).not.toHaveBeenCalled();
    });

    it("fetches and returns the created/updated role assignment", async () => {
      const result = await demonstrationRoleAssigmentResolvers.Mutation.setDemonstrationRole(null, {
        input: testInput,
      });

      expect(selectDemonstrationRoleAssignmentOrThrow).toHaveBeenCalledExactlyOnceWith(
        {
          personId: testInput.personId,
          demonstrationId: testInput.demonstrationId,
          roleId: testInput.roleId,
        },
        mockPrismaTransaction
      );
      expect(result).toBe(mockRoleAssignment);
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
