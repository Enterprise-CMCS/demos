import { beforeEach, describe, expect, it, vi } from "vitest";
import { validatePersonEligibleForDemonstrationRole } from "./validatePersonEligibleForDemonstrationRole";
import { prisma } from "../../prismaClient";

// Mock imports
const testCustomGQLError = new Error("Test throwCustomGQLError!");
vi.mock("../../errors/errorCodes", () => ({
  throwCustomGQLError: vi.fn(() => {
    throw testCustomGQLError;
  }),
}));

import { throwCustomGQLError } from "../../errors/errorCodes";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

const mockPersonId = "person-id";
const mockRoleId = "State Point of Contact";
const mockPersonTypeId = "demos-state-user";

describe("validatePersonEligibleForDemonstrationRole", () => {
  const regularMocks = {
    person: {
      findUniqueOrThrow: vi.fn(),
    },
    rolePersonType: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    person: {
      findUniqueOrThrow: regularMocks.person.findUniqueOrThrow,
    },
    rolePersonType: {
      findMany: regularMocks.rolePersonType.findMany,
    },
  };
  const transactionMocks = {
    person: {
      findUniqueOrThrow: vi.fn(),
    },
    rolePersonType: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    person: {
      findUniqueOrThrow: transactionMocks.person.findUniqueOrThrow,
    },
    rolePersonType: {
      findMany: transactionMocks.rolePersonType.findMany,
    },
  } as any;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
    regularMocks.person.findUniqueOrThrow.mockResolvedValue({
      id: mockPersonId,
      personTypeId: mockPersonTypeId,
    });
    regularMocks.rolePersonType.findMany.mockResolvedValue([{ roleId: mockRoleId }]);
  });

  it("should look up the person directly if no transaction is given", async () => {
    await validatePersonEligibleForDemonstrationRole(mockPersonId, mockRoleId);
    expect(regularMocks.person.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith({
      where: { id: mockPersonId },
      select: { id: true, personTypeId: true },
    });
    expect(transactionMocks.person.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("should look up the person via a transaction if one is given", async () => {
    transactionMocks.person.findUniqueOrThrow.mockResolvedValueOnce({
      id: mockPersonId,
      personTypeId: mockPersonTypeId,
    });
    transactionMocks.rolePersonType.findMany.mockResolvedValueOnce([{ roleId: mockRoleId }]);

    await validatePersonEligibleForDemonstrationRole(mockPersonId, mockRoleId, mockTransaction);

    expect(regularMocks.person.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(transactionMocks.person.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith({
      where: { id: mockPersonId },
      select: { id: true, personTypeId: true },
    });
    expect(transactionMocks.rolePersonType.findMany).toHaveBeenCalledExactlyOnceWith({
      where: { personTypeId: mockPersonTypeId, roleId: mockRoleId },
      select: { roleId: true },
    });
  });

  it("should check for an eligible role using the person's type and the given role", async () => {
    await validatePersonEligibleForDemonstrationRole(mockPersonId, mockRoleId);
    expect(regularMocks.rolePersonType.findMany).toHaveBeenCalledExactlyOnceWith({
      where: { personTypeId: mockPersonTypeId, roleId: mockRoleId },
      select: { roleId: true },
    });
  });

  it("should not throw an error if the person is eligible for exactly one matching role", async () => {
    await expect(
      validatePersonEligibleForDemonstrationRole(mockPersonId, mockRoleId)
    ).resolves.not.toThrow();
    expect(throwCustomGQLError).not.toHaveBeenCalled();
  });

  it("should throw an error if the person has no eligible roles", async () => {
    regularMocks.rolePersonType.findMany.mockResolvedValue([]);

    await expect(
      validatePersonEligibleForDemonstrationRole(mockPersonId, mockRoleId)
    ).rejects.toThrow(testCustomGQLError);
    expect(throwCustomGQLError).toHaveBeenCalledExactlyOnceWith(
      `Person with ID ${mockPersonId} of type ${mockPersonTypeId} is not eligible for role with ID ${mockRoleId}.`,
      "DEMONSTRATION_ROLE_ASSIGNMENT_ERROR"
    );
  });
});
