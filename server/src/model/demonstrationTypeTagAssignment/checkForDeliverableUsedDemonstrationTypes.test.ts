import { beforeEach, describe, expect, it, vi } from "vitest";
import { TZDate } from "@date-fns/tz";
import { GraphQLError } from "graphql";
import { PrismaTransactionClient } from "../../prismaClient";
import {
  DeliverableDemonstrationTypeQueryResult,
  selectManyDeliverableDemonstrationTypes,
} from "../deliverableDemonstrationType/queries";
import { ParsedSetDemonstrationTypesInput } from "./demonstrationTypeTagAssignmentTypes";
import { checkForDeliverableUsedDemonstrationTypes } from "./checkForDeliverableUsedDemonstrationTypes";

vi.mock("../deliverableDemonstrationType/queries", () => ({
  selectManyDeliverableDemonstrationTypes: vi.fn(),
}));

describe("checkForDeliverableUsedDemonstrationTypes", () => {
  const mockTransaction = {} as PrismaTransactionClient;
  const testInput: ParsedSetDemonstrationTypesInput = {
    demonstrationId: "2a0e9903-3c5f-4a16-a044-92b776de5ec0",
    demonstrationTypesToDelete: ["Type One", "Type Two"],
    demonstrationTypesToUpsert: [
      {
        demonstrationTypeName: "Type Three",
        demonstrationTypeDates: {
          effectiveDate: new TZDate("2026-10-22T04:00:00.000Z", "America/New_York"),
          expirationDate: new TZDate("2031-10-23T03:59:59.999Z", "America/New_York"),
        },
      },
    ],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(selectManyDeliverableDemonstrationTypes).mockResolvedValue([]);
  });

  it("should skip the lookup for additions and date-only edits", async () => {
    await expect(
      checkForDeliverableUsedDemonstrationTypes(
        { ...testInput, demonstrationTypesToDelete: [] },
        mockTransaction
      )
    ).resolves.toBeUndefined();

    expect(selectManyDeliverableDemonstrationTypes).not.toHaveBeenCalled();
  });

  it("should allow unlinked removals and query only the requested removals on this demonstration", async () => {
    await expect(
      checkForDeliverableUsedDemonstrationTypes(testInput, mockTransaction)
    ).resolves.toBeUndefined();

    expect(selectManyDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      {
        demonstrationId: testInput.demonstrationId,
        demonstrationTypeTagNameId: { in: ["Type One", "Type Two"] },
      },
      mockTransaction
    );
  });

  it("should reject linked removals with a validation error and list each linked type once", async () => {
    vi.mocked(selectManyDeliverableDemonstrationTypes).mockResolvedValue([
      { demonstrationTypeTagNameId: "Type One" },
      { demonstrationTypeTagNameId: "Type One" },
      { demonstrationTypeTagNameId: "Type Two" },
    ] as DeliverableDemonstrationTypeQueryResult[]);

    const result = checkForDeliverableUsedDemonstrationTypes(testInput, mockTransaction);

    await expect(result).rejects.toBeInstanceOf(GraphQLError);
    await expect(result).rejects.toMatchObject({
      message:
        "Cannot remove demonstration types associated with a deliverable: Type One, Type Two.",
      extensions: { code: "BAD_USER_INPUT" },
    });
  });

  it("should reject a mixed removal when only one requested type is linked", async () => {
    vi.mocked(selectManyDeliverableDemonstrationTypes).mockResolvedValue([
      { demonstrationTypeTagNameId: "Type Two" },
    ] as DeliverableDemonstrationTypeQueryResult[]);

    await expect(
      checkForDeliverableUsedDemonstrationTypes(testInput, mockTransaction)
    ).rejects.toMatchObject({
      message: "Cannot remove demonstration types associated with a deliverable: Type Two.",
      extensions: { code: "BAD_USER_INPUT" },
    });
  });
});
