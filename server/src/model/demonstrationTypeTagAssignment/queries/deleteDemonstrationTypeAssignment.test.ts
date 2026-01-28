import { describe, it, expect, vi } from "vitest";
import { deleteDemonstrationTypeAssignments } from "./deleteDemonstrationTypeAssignments.js";
import { ParsedSetDemonstrationTypesInput } from "..";

describe("deleteDemonstrationTypeAssignments", () => {
  const transactionMocks = {
    demonstrationTypeTagAssignment: {
      deleteMany: vi.fn(),
    },
  };
  const mockTransaction = {
    demonstrationTypeTagAssignment: {
      deleteMany: transactionMocks.demonstrationTypeTagAssignment.deleteMany,
    },
  } as any;
  const testDemonstrationId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";

  it("should delete removed demonstration types", async () => {
    const testInput: ParsedSetDemonstrationTypesInput = {
      demonstrationId: testDemonstrationId,
      demonstrationTypesToUpsert: [],
      demonstrationTypesToDelete: ["Type One", "Type 3"],
    };
    const expectedCall = {
      where: {
        demonstrationId: testDemonstrationId,
        tagId: {
          in: ["Type One", "Type 3"],
        },
      },
    };

    await deleteDemonstrationTypeAssignments(testInput, mockTransaction);
    expect(
      transactionMocks.demonstrationTypeTagAssignment.deleteMany
    ).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
