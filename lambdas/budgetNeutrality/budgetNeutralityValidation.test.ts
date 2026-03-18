import { describe, expect, it } from "vitest";
import {
  parseAndValidateBudgetNeutralityMessage,
  validateSingleRecordCount,
} from "./budgetNeutralityValidation";

describe("budgetNeutralityValidation", () => {
  describe("validateSingleRecordCount", () => {
    it("does not throw for one record", () => {
      expect(() => validateSingleRecordCount(1)).not.toThrow();
    });

    it("throws when zero records are provided", () => {
      expect(() => validateSingleRecordCount(0)).toThrow(
        "Expected exactly 1 record, received 0."
      );
    });

    it("throws when more than one record is provided", () => {
      expect(() => validateSingleRecordCount(2)).toThrow(
        "Expected exactly 1 record, received 2."
      );
    });
  });

  describe("parseAndValidateBudgetNeutralityMessage", () => {
    it("returns parsed message for a valid Final BN Worksheet payload", () => {
      const message = parseAndValidateBudgetNeutralityMessage(
        JSON.stringify({
          documentId: "0d3f4a68-195d-49ef-8d36-0cc0eaa31935",
          documentTypeId: "Final BN Worksheet",
        })
      );

      expect(message).toEqual({
        documentId: "0d3f4a68-195d-49ef-8d36-0cc0eaa31935",
        documentTypeId: "Final BN Worksheet",
      });
    });

    it("throws when documentId is missing", () => {
      expect(() =>
        parseAndValidateBudgetNeutralityMessage(
          JSON.stringify({ documentTypeId: "Final BN Worksheet" })
        )
      ).toThrow("Invalid message: documentId is required.");
    });

    it("throws when documentTypeId is missing", () => {
      expect(() =>
        parseAndValidateBudgetNeutralityMessage(
          JSON.stringify({ documentId: "0d3f4a68-195d-49ef-8d36-0cc0eaa31935" })
        )
      ).toThrow("Invalid message: documentTypeId is required.");
    });

    it("throws when documentTypeId is not Final BN Worksheet", () => {
      expect(() =>
        parseAndValidateBudgetNeutralityMessage(
          JSON.stringify({
            documentId: "0d3f4a68-195d-49ef-8d36-0cc0eaa31935",
            documentTypeId: "State Application",
          })
        )
      ).toThrow(
        'Invalid message: documentTypeId must be "Final BN Worksheet". Received "State Application".'
      );
    });
  });
});
