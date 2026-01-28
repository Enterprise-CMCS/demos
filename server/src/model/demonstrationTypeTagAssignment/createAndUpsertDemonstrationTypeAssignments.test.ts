import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAndUpsertDemonstrationTypeAssignments } from "./createAndUpsertDemonstrationTypeAssignments";

// Mock imports
import { createApplicationTagsDemonstrationTypesIfNotExists } from "../applicationTagAssignment";
import { upsertDemonstrationTypeAssignments, ParsedSetDemonstrationTypesInput } from ".";
import { TZDate } from "@date-fns/tz";

vi.mock("../applicationTagAssignment", () => ({
  createApplicationTagsDemonstrationTypesIfNotExists: vi.fn(),
}));

vi.mock(".", () => ({
  upsertDemonstrationTypeAssignments: vi.fn(),
}));

describe("createAndUpsertDemonstrationTypeAssignments", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const testInput: ParsedSetDemonstrationTypesInput = {
    demonstrationId: "5bc4edae-ea3f-49f2-b549-9d49f2e9bdd8",
    demonstrationTypesToUpsert: [
      {
        demonstrationTypeName: "Type One",
        demonstrationTypeDates: {
          effectiveDate: new TZDate(),
          expirationDate: new TZDate(),
        },
      },
      {
        demonstrationTypeName: "Type Two",
        demonstrationTypeDates: {
          effectiveDate: new TZDate(),
          expirationDate: new TZDate(),
        },
      },
    ],
    demonstrationTypesToDelete: ["Type Three"],
  };
  const mockTransaction: any = "Test Transaction";

  it("should create tags and then upsert records", async () => {
    await createAndUpsertDemonstrationTypeAssignments(testInput, mockTransaction);

    expect(createApplicationTagsDemonstrationTypesIfNotExists).toHaveBeenCalledExactlyOnceWith(
      ["Type One", "Type Two"],
      mockTransaction
    );
    expect(upsertDemonstrationTypeAssignments).toHaveBeenCalledExactlyOnceWith(
      testInput.demonstrationId,
      testInput.demonstrationTypesToUpsert,
      mockTransaction
    );
  });
});
