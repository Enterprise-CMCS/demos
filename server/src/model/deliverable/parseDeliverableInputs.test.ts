// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TZDate } from "@date-fns/tz";

// Types
import { EasternTZDate } from "../../dateUtilities";
import {
  CreateDeliverableInput,
  DateTimeOrLocalDate,
  RequestDeliverableExtensionInput,
  RequestDeliverableResubmissionInput,
  UpdateDeliverableInput,
} from "../../types";
import { ParsedCreateDeliverableInput, ParsedUpdateDeliverableInput } from ".";

// Functions under test
import {
  parseCreateDeliverableInput,
  parseRequestDeliverableExtensionInput,
  parseRequestDeliverableResubmissionInput,
  parseUpdateDeliverableInput,
} from "./parseDeliverableInputs";

// Mock imports
vi.mock("../../dateUtilities", () => ({
  parseDateTimeOrLocalDateToEasternTZDate: vi.fn(),
}));

vi.mock("../applicationDate", () => ({
  checkInputDateIsEndOfDay: vi.fn(),
}));

vi.mock(".", () => ({
  checkForDuplicateDemonstrationTypes: vi.fn(),
}));

import { parseDateTimeOrLocalDateToEasternTZDate } from "../../dateUtilities";
import { checkInputDateIsEndOfDay } from "../applicationDate";
import { checkForDuplicateDemonstrationTypes } from ".";

describe("parseDeliverableInputs", () => {
  const mockParsedDate: EasternTZDate = {
    isEasternTZDate: true,
    easternTZDate: new TZDate(2024, 10, 13, 23, 59, 59, 999, "America/New_York"),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(parseDateTimeOrLocalDateToEasternTZDate).mockReturnValue(mockParsedDate);
  });

  describe("parseCreateDeliverableInput", () => {
    const baseTestInput: CreateDeliverableInput = {
      name: "A new deliverable name!",
      deliverableType: "HCBS Deficiency, Remediation and A/N/E Incident Report (1915(c)-like)",
      demonstrationId: "2bc27502-c286-4e1a-a5a5-3a45ad441149",
      cmsOwnerUserId: "d6b52b4f-42d3-4c5d-a26d-8a519d15a501",
      dueDate: "2024-11-13" as DateTimeOrLocalDate,
    };
    const baseExpectedResult: ParsedCreateDeliverableInput = {
      name: baseTestInput.name,
      deliverableType: baseTestInput.deliverableType,
      demonstrationId: baseTestInput.demonstrationId,
      cmsOwnerUserId: baseTestInput.cmsOwnerUserId,
      dueDate: mockParsedDate,
    };

    it("should parse the input, check the dates, validate the demonstration types, and return the updated object", () => {
      const testInput = {
        ...baseTestInput,
        demonstrationTypes: ["Free Insulin"],
      };
      const expectedResult = {
        ...baseExpectedResult,
        demonstrationTypes: new Set(testInput.demonstrationTypes),
      };
      const result = parseCreateDeliverableInput(testInput);
      expect(parseDateTimeOrLocalDateToEasternTZDate).toHaveBeenCalledExactlyOnceWith(
        testInput.dueDate,
        "End of Day"
      );
      expect(checkInputDateIsEndOfDay).toHaveBeenCalledExactlyOnceWith("dueDate", mockParsedDate);
      expect(checkForDuplicateDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
        testInput.demonstrationTypes
      );
      expect(result).toStrictEqual(expectedResult);
    });

    it("should skip demonstration type handling if they are not included", () => {
      const testInput = {
        ...baseTestInput,
      };
      const expectedResult = {
        ...baseExpectedResult,
      };
      const result = parseCreateDeliverableInput(testInput);
      expect(parseDateTimeOrLocalDateToEasternTZDate).toHaveBeenCalledExactlyOnceWith(
        testInput.dueDate,
        "End of Day"
      );
      expect(checkInputDateIsEndOfDay).toHaveBeenCalledExactlyOnceWith("dueDate", mockParsedDate);
      expect(checkForDuplicateDemonstrationTypes).not.toHaveBeenCalled();
      expect(result).toStrictEqual(expectedResult);
    });

    it("should throw if given duplicate demonstration types", () => {
      vi.mocked(checkForDuplicateDemonstrationTypes).mockReturnValue("There are duplicates!!");
      const testInput = {
        ...baseTestInput,
        demonstrationTypes: ["Free Insulin", "Free Insulin"],
      };

      try {
        parseCreateDeliverableInput(testInput);
        throw new Error("Expected parseCreateDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        const error = e as Error;
        expect(error.message).toBe("There are duplicates!!");
      }
    });
  });

  describe("parseUpdateDeliverableInput", () => {
    const baseTestInput: UpdateDeliverableInput = {
      name: "An updated deliverable name!",
    };

    it("should parse the input and return the updated object", () => {
      const testInput = {
        ...baseTestInput,
      };
      const expectedResult: ParsedUpdateDeliverableInput = {
        name: testInput.name,
      };

      const result = parseUpdateDeliverableInput(testInput);
      expect(result).toStrictEqual(expectedResult);
    });

    it("should not call date or demonstration type functions if those aren't passed in", () => {
      const testInput = {
        ...baseTestInput,
      };
      const expectedResult: ParsedUpdateDeliverableInput = {
        name: testInput.name,
      };

      parseUpdateDeliverableInput(testInput);
      expect(parseDateTimeOrLocalDateToEasternTZDate).not.toHaveBeenCalled();
      expect(checkInputDateIsEndOfDay).not.toHaveBeenCalled();
      expect(checkForDuplicateDemonstrationTypes).not.toHaveBeenCalled();
    });

    it("should call date handling functions if they are passed in", () => {
      const testInput = {
        ...baseTestInput,
        dueDate: {
          newDueDate: "2024-11-13" as DateTimeOrLocalDate,
          dateChangeNote: "A required note",
        },
      };
      const expectedResult: ParsedUpdateDeliverableInput = {
        name: testInput.name,
        dueDate: {
          newDueDate: mockParsedDate,
          dateChangeNote: testInput.dueDate.dateChangeNote,
        },
      };

      const result = parseUpdateDeliverableInput(testInput);
      expect(parseDateTimeOrLocalDateToEasternTZDate).toHaveBeenCalledExactlyOnceWith(
        testInput.dueDate.newDueDate,
        "End of Day"
      );
      expect(checkInputDateIsEndOfDay).toHaveBeenCalledExactlyOnceWith("dueDate", mockParsedDate);
      expect(checkForDuplicateDemonstrationTypes).not.toHaveBeenCalled();
      expect(result).toStrictEqual(expectedResult);
    });

    it("should call demonstration type functions if they are passed in", () => {
      const testInput = {
        ...baseTestInput,
        demonstrationTypes: ["Free Insulin", "Vitamin A Supplements for Newborns"],
      };
      const expectedResult: ParsedUpdateDeliverableInput = {
        name: testInput.name,
        demonstrationTypes: new Set(testInput.demonstrationTypes),
      };

      const result = parseUpdateDeliverableInput(testInput);
      expect(parseDateTimeOrLocalDateToEasternTZDate).not.toHaveBeenCalled();
      expect(checkInputDateIsEndOfDay).not.toHaveBeenCalled();
      expect(checkForDuplicateDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
        testInput.demonstrationTypes
      );
      expect(result).toStrictEqual(expectedResult);
    });

    it("should call demonstration type and date functions if both are passed in", () => {
      const testInput = {
        ...baseTestInput,
        dueDate: {
          newDueDate: "2024-11-13" as DateTimeOrLocalDate,
          dateChangeNote: "A required note",
        },
        demonstrationTypes: ["Free Insulin", "Vitamin A Supplements for Newborns"],
      };
      const expectedResult: ParsedUpdateDeliverableInput = {
        name: testInput.name,
        dueDate: {
          newDueDate: mockParsedDate,
          dateChangeNote: testInput.dueDate.dateChangeNote,
        },
        demonstrationTypes: new Set(testInput.demonstrationTypes),
      };

      const result = parseUpdateDeliverableInput(testInput);
      expect(parseDateTimeOrLocalDateToEasternTZDate).toHaveBeenCalledExactlyOnceWith(
        testInput.dueDate.newDueDate,
        "End of Day"
      );
      expect(checkInputDateIsEndOfDay).toHaveBeenCalledExactlyOnceWith("dueDate", mockParsedDate);
      expect(checkForDuplicateDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
        testInput.demonstrationTypes
      );
      expect(result).toStrictEqual(expectedResult);
    });

    it("should throw if given duplicate demonstration types", () => {
      vi.mocked(checkForDuplicateDemonstrationTypes).mockReturnValue("There are duplicates!!");
      const testInput = {
        ...baseTestInput,
        demonstrationTypes: ["Free Insulin", "Free Insulin"],
      };

      try {
        parseUpdateDeliverableInput(testInput);
        throw new Error("Expected parseUpdateDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        const error = e as Error;
        expect(error.message).toBe("There are duplicates!!");
      }
    });
  });

  describe("parseRequestDeliverableResubmissionInput", () => {
    const testInput: RequestDeliverableResubmissionInput = {
      details: "A set of details",
      newDueDate: "2025-11-13" as DateTimeOrLocalDate,
    };

    it("should parse the input, check the date, and return the updated object", () => {
      const result = parseRequestDeliverableResubmissionInput(testInput);
      expect(parseDateTimeOrLocalDateToEasternTZDate).toHaveBeenCalledExactlyOnceWith(
        testInput.newDueDate,
        "End of Day"
      );
      expect(checkInputDateIsEndOfDay).toHaveBeenCalledExactlyOnceWith("dueDate", mockParsedDate);
      expect(result).toStrictEqual({
        details: testInput.details,
        newDueDate: mockParsedDate,
      });
    });
  });

  describe("parseRequestDeliverableExtensionInput", () => {
    const testInput: RequestDeliverableExtensionInput = {
      reason: "COVID-19",
      details: "A set of details",
      requestedDueDate: "2025-11-13" as DateTimeOrLocalDate,
    };

    it("should parse the input, check the date, and return the updated object", () => {
      const result = parseRequestDeliverableExtensionInput(testInput);
      expect(parseDateTimeOrLocalDateToEasternTZDate).toHaveBeenCalledExactlyOnceWith(
        testInput.requestedDueDate,
        "End of Day"
      );
      expect(checkInputDateIsEndOfDay).toHaveBeenCalledExactlyOnceWith("dueDate", mockParsedDate);
      expect(result).toStrictEqual({
        reason: testInput.reason,
        details: testInput.details,
        requestedDueDate: mockParsedDate,
      });
    });
  });
});
