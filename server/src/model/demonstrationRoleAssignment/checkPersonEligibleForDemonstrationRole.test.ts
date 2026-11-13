import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkPersonEligibleForDemonstrationRole } from "./checkPersonEligibleForDemonstrationRole";
import { prisma } from "../../prismaClient";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

const mockPersonId = "person-id";
const mockRoleId = "State Point of Contact";
const mockPersonTypeId = "demos-state-user";

describe("checkPersonEligibleForDemonstrationRole", () => {
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
    await checkPersonEligibleForDemonstrationRole(mockPersonId, mockRoleId);
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

    await checkPersonEligibleForDemonstrationRole(mockPersonId, mockRoleId, mockTransaction);

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
    await checkPersonEligibleForDemonstrationRole(mockPersonId, mockRoleId);
    expect(regularMocks.rolePersonType.findMany).toHaveBeenCalledExactlyOnceWith({
      where: { personTypeId: mockPersonTypeId, roleId: mockRoleId },
      select: { roleId: true },
    });
  });

  it("should return undefined if the person is eligible for exactly one matching role", async () => {
    await expect(
      checkPersonEligibleForDemonstrationRole(mockPersonId, mockRoleId)
    ).resolves.toBeUndefined();
  });

  it("should return an error message if the person has no eligible roles", async () => {
    regularMocks.rolePersonType.findMany.mockResolvedValue([]);

    await expect(checkPersonEligibleForDemonstrationRole(mockPersonId, mockRoleId)).resolves.toBe(
      `Person with id ${mockPersonId} of type ${mockPersonTypeId} is not eligible for the ${mockRoleId} demonstration role.`
    );
  });
});
