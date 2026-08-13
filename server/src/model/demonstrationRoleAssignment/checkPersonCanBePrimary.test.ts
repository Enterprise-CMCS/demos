import { describe, it, expect, vi, beforeEach } from "vitest";

import { checkPersonCanBePrimary } from "./checkPersonCanBePrimary";
import { SetDemonstrationRoleInput } from "./demonstrationRoleAssignmentSchema";
import { Role, PersonType } from "../../types";
import type { Person as PrismaPerson } from "@prisma/client";

const mockTransaction = {
  person: {
    findUnique: vi.fn(),
  },
} as any;

describe("checkPersonCanBePrimary", () => {
  const testInput: SetDemonstrationRoleInput = {
    demonstrationId: "test-demo-id",
    personId: "test-person-id",
    roleId: "DDME Analyst" satisfies Role,
    isPrimary: true,
  };

  const mockPerson: Partial<PrismaPerson> = {
    id: testInput.personId,
    personTypeId: "demos-cms-user" satisfies PersonType,
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined when isPrimary is false", async () => {
    const input: SetDemonstrationRoleInput = {
      ...testInput,
      isPrimary: false,
    };

    mockTransaction.person.findUnique.mockResolvedValue(mockPerson as PrismaPerson);

    const result = await checkPersonCanBePrimary(input, mockTransaction);
    expect(result).toBeUndefined();
  });

  it("should return undefined when isPrimary is true and person type is allowed to be primary", async () => {
    const personWithCmsType: Partial<PrismaPerson> = {
      ...mockPerson,
      personTypeId: "demos-cms-user" satisfies PersonType,
    };

    mockTransaction.person.findUnique.mockResolvedValue(personWithCmsType as PrismaPerson);

    const result = await checkPersonCanBePrimary(testInput, mockTransaction);
    expect(result).toBeUndefined();
  });

  it("should return error message when isPrimary is true and person type is not allowed", async () => {
    const personWithRestrictedType: Partial<PrismaPerson> = {
      ...mockPerson,
      personTypeId: "demos-restricted-cms-user" satisfies PersonType,
    };

    mockTransaction.person.findUnique.mockResolvedValue(personWithRestrictedType as PrismaPerson);

    const result = await checkPersonCanBePrimary(testInput, mockTransaction);
    expect(result).toBeDefined();
    expect(result).toContain("not permitted to be assigned as the primary role");
  });

  it("should throw an error when person is not found", async () => {
    mockTransaction.person.findUnique.mockResolvedValue(null);

    await expect(checkPersonCanBePrimary(testInput, mockTransaction)).rejects.toThrow(
      `Person with ID ${testInput.personId} not found.`
    );
  });
});
