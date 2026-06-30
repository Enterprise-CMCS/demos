// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import { ApplicationStatus } from "../../types";
import { Demonstration as PrismaDemonstration } from "@prisma/client";
import { GraphQLError } from "graphql";

// Functions under test
import { validateCreateExtensionInput } from "./validateExtensionInputs";

// Mock imports
vi.mock("../application", () => ({
  getApplication: vi.fn(),
}));

vi.mock("../demonstration", () => ({
  checkDemonstrationStatus: vi.fn(),
}));

import { getApplication } from "../application";
import { checkDemonstrationStatus } from "../demonstration";

describe("validateExtensionInputs", () => {
  const mockDemonstration: Partial<PrismaDemonstration> = {
    id: "791b5e55-680d-47f3-bfba-9f242b69b8b2",
    statusId: "Approved" satisfies ApplicationStatus,
  };

  const mockTransaction: any = "Test!";

  describe("validateCreateExtensionInput", () => {
    const testInput: { demonstrationId: string } = {
      demonstrationId: mockDemonstration.id!,
    };

    beforeEach(() => {
      vi.resetAllMocks();
      vi.mocked(getApplication).mockResolvedValue(mockDemonstration as PrismaDemonstration);
    });

    it("should not throw if none of the rules are violated", async () => {
      // Note: don't need to set returns to undefined, as this is what vi.fn() does already
      await expect(
        validateCreateExtensionInput(testInput, mockTransaction)
      ).resolves.toBeUndefined();
    });

    it("should get the demonstration info", async () => {
      await validateCreateExtensionInput(testInput, mockTransaction);
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testInput.demonstrationId, {
        applicationTypeId: "Demonstration",
        tx: mockTransaction,
      });
    });

    it("should call the checking functions, using the results of the queries if appropriate", async () => {
      await validateCreateExtensionInput(testInput, mockTransaction);
      expect(checkDemonstrationStatus).toHaveBeenCalledExactlyOnceWith(
        mockDemonstration,
        "extension"
      );
    });

    it("should throw if the demonstration status check fails", async () => {
      vi.mocked(checkDemonstrationStatus).mockReturnValue("The demo status check failed");

      try {
        await validateCreateExtensionInput(testInput, mockTransaction);
        throw new Error("Expected validateCreateExtensionInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for createExtension have failed."
        );
        expect(error.extensions.code).toBe("CREATE_EXTENSION_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual(["The demo status check failed"]);
      }
    });

    it("should combine all errors into one object", async () => {
      vi.mocked(checkDemonstrationStatus).mockReturnValue("The demo status check failed");

      try {
        await validateCreateExtensionInput(testInput, mockTransaction);
        throw new Error("Expected validateCreateExtensionInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for createExtension have failed."
        );
        expect(error.extensions.code).toBe("CREATE_EXTENSION_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual(["The demo status check failed"]);
      }
    });
  });
});
