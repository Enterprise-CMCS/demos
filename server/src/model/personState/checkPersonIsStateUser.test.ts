import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkPersonIsStateUser } from "./checkPersonIsStateUser";
import { selectPerson } from "../person/queries";
import type { Person as PrismaPerson } from "@prisma/client";
import { PersonType } from "../../types";

vi.mock("../person/queries", () => ({
  selectPerson: vi.fn(),
}));

describe("checkPersonIsStateUser", () => {
  const testPersonId = "person-123-456";
  const mockTransaction = "Test!" as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined if the person is a state user", async () => {
    vi.mocked(selectPerson).mockResolvedValue({
      id: testPersonId,
      personTypeId: "demos-state-user",
    } as PrismaPerson);

    await expect(checkPersonIsStateUser(testPersonId, mockTransaction)).resolves.toBeUndefined();
    expect(selectPerson).toHaveBeenCalledExactlyOnceWith(
      { id: testPersonId, personTypeId: "demos-state-user" as PersonType },
      mockTransaction
    );
  });

  it("should return an error message if the person is not a state user", async () => {
    vi.mocked(selectPerson).mockResolvedValue(null);

    await expect(checkPersonIsStateUser(testPersonId, mockTransaction)).resolves.toBe(
      `Person ${testPersonId} is not a state user.`
    );
    expect(selectPerson).toHaveBeenCalledExactlyOnceWith(
      { id: testPersonId, personTypeId: "demos-state-user" as PersonType },
      mockTransaction
    );
  });
});
