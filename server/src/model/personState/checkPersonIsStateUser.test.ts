import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkPersonIsStateUser } from "./checkPersonIsStateUser";
import { selectPersonOrThrow } from "../person/queries";
import type { Person as PrismaPerson } from "@prisma/client";

vi.mock("../person/queries", () => ({
  selectPersonOrThrow: vi.fn(),
}));

describe("checkPersonIsStateUser", () => {
  const testPersonId = "person-123-456";
  const mockTransaction = "Test!" as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined if the person is a state user", async () => {
    vi.mocked(selectPersonOrThrow).mockResolvedValue({
      id: testPersonId,
      personTypeId: "demos-state-user",
    } as PrismaPerson);

    await expect(checkPersonIsStateUser(testPersonId, mockTransaction)).resolves.toBeUndefined();
    expect(selectPersonOrThrow).toHaveBeenCalledExactlyOnceWith(
      { id: testPersonId },
      mockTransaction
    );
  });

  it("should return an error message if the person is not a state user", async () => {
    vi.mocked(selectPersonOrThrow).mockResolvedValue({
      id: testPersonId,
      personTypeId: "demos-cms-user",
    } as PrismaPerson);

    await expect(checkPersonIsStateUser(testPersonId, mockTransaction)).resolves.toBe(
      `Person ${testPersonId} is not a state user.`
    );
    expect(selectPersonOrThrow).toHaveBeenCalledExactlyOnceWith(
      { id: testPersonId },
      mockTransaction
    );
  });
});
