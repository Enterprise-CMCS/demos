import { describe, it, expect, vi, beforeEach } from "vitest";
import { SetDemonstrationTypesInput } from "../../types";
import { checkForDuplicateDemonstrationTypes } from "./checkForDuplicateDemonstrationTypes";

// Mock imports
import { findDuplicates } from "../../validationUtilities";

vi.mock("../../validationUtilities", () => ({
  findDuplicates: vi.fn(),
}));

describe("checkForDuplicateDemonstrationTypes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const testInput: SetDemonstrationTypesInput = {
    demonstrationId: "5bc4edae-ea3f-49f2-b549-9d49f2e9bdd8",
    demonstrationTypes: [
      {
        demonstrationTypeName: "Type One",
        demonstrationTypeDates: {
          effectiveDate: new Date(),
          expirationDate: new Date(),
        },
      },
      {
        demonstrationTypeName: "Type Two",
        demonstrationTypeDates: {
          effectiveDate: new Date(),
          expirationDate: new Date(),
        },
      },
      {
        demonstrationTypeName: "Type Three",
        demonstrationTypeDates: null,
      },
    ],
  };

  it("should check the input for duplicates", () => {
    vi.mocked(findDuplicates).mockReturnValueOnce([]);

    checkForDuplicateDemonstrationTypes(testInput);

    expect(findDuplicates).toHaveBeenCalledExactlyOnceWith(["Type One", "Type Two", "Type Three"]);
  });

  it("should not throw if no duplicates are returned", () => {
    vi.mocked(findDuplicates).mockReturnValueOnce([]);

    expect(() => checkForDuplicateDemonstrationTypes(testInput)).not.toThrow();
  });

  it("should throw if duplicates are returned", () => {
    vi.mocked(findDuplicates).mockReturnValueOnce(["Type One"]);

    expect(() => checkForDuplicateDemonstrationTypes(testInput)).toThrow(
      "The input contained the same demonstrationTypeName more than once for " +
        "these demonstrationTypeNames: Type One."
    );
  });
});
