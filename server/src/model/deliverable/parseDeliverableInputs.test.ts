// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TZDate } from "@date-fns/tz";

// Types
import { EasternTZDate } from "../../dateUtilities";
import {
  ApproveDeliverableExtensionInput,
  CreateDeliverableInput,
  DateTimeOrLocalDate,
  RequestDeliverableExtensionInput,
  RequestDeliverableResubmissionInput,
  UpdateDeliverableInput,
} from "../../types";
import { ParsedCreateDeliverableInput, ParsedUpdateDeliverableInput } from ".";
import { DeliverableExtension as PrismaDeliverableExtension } from "@prisma/client";

// Functions under test
import {
  parseApproveDeliverableExtensionInput,
  parseCreateDeliverableInput,
  parseRequestDeliverableExtensionInput,
  parseRequestDeliverableResubmissionInput,
  parseUpdateDeliverableInput,
} from "./parseDeliverableInputs";

// Mock imports
vi.mock("../../dateUtilities", () => ({
  parseDateTimeOrLocalDateToEasternTZDate: vi.fn(),
  parseJSDateToEasternTZDate: vi.fn(),
}));

vi.mock("../applicationDate", () => ({
  checkInputDateIsEndOfDay: vi.fn(),
}));

vi.mock(".", () => ({
  checkForDuplicateDemonstrationTypes: vi.fn(),
}));

import {
  parseDateTimeOrLocalDateToEasternTZDate,
  parseJSDateToEasternTZDate,
} from "../../dateUtilities";
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

    it("should trim the deliverable name", () => {
      const testInput = {
        ...baseTestInput,
        name: "  A new deliverable name!  ",
      };

      const result = parseCreateDeliverableInput(testInput);

      expect(result.name).toBe("A new deliverable name!");
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

    it("should trim the deliverable name when one is provided", () => {
      const testInput = {
        ...baseTestInput,
        name: "  An updated deliverable name!  ",
      };

      const result = parseUpdateDeliverableInput(testInput);

      expect(result.name).toBe("An updated deliverable name!");
    });

    it("should not call date or demonstration type functions if those aren't passed in", () => {
      const testInput = {
        ...baseTestInput,
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

  describe("parseApproveDeliverableExtensionInput", () => {
    it("should parse the input and use the date from the DB if no date is given", () => {
      const testInput: ApproveDeliverableExtensionInput = {
        deliverableExtensionId: "a57dbf4f-12ab-4d40-b236-1fd13201a99c",
      };
      const testDeliverableExtension: Partial<PrismaDeliverableExtension> = {
        originalDateRequested: new Date(2027, 10, 12, 4, 59, 59, 999),
      };
      const mockTZDate = new TZDate(2027, 10, 11, 23, 59, 59, 999, "America/New_York");
      vi.mocked(parseJSDateToEasternTZDate).mockReturnValue({
        isEasternTZDate: true,
        easternTZDate: mockTZDate,
      });

      const result = parseApproveDeliverableExtensionInput(
        testInput,
        testDeliverableExtension as PrismaDeliverableExtension
      );
      expect(parseDateTimeOrLocalDateToEasternTZDate).not.toHaveBeenCalled();
      expect(checkInputDateIsEndOfDay).not.toHaveBeenCalled();
      expect(parseJSDateToEasternTZDate).toHaveBeenCalledExactlyOnceWith(
        testDeliverableExtension.originalDateRequested
      );
      expect(result).toStrictEqual({
        deliverableExtensionId: testInput.deliverableExtensionId,
        finalDateGranted: {
          isEasternTZDate: true,
          easternTZDate: mockTZDate,
        },
      });
    });

    it("should parse the input and use inputted date if it is present", () => {
      const testInput: ApproveDeliverableExtensionInput = {
        deliverableExtensionId: "a57dbf4f-12ab-4d40-b236-1fd13201a99c",
        newDueDate: new Date(2027, 10, 12, 4, 59, 59, 999),
      };
      const testDeliverableExtension: Partial<PrismaDeliverableExtension> = {
        originalDateRequested: new Date(2027, 7, 11, 3, 59, 59, 999),
      };
      const mockDateReturnValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2027, 10, 11, 23, 59, 59, 999, "America/New_York"),
      };
      vi.mocked(parseDateTimeOrLocalDateToEasternTZDate).mockReturnValue(mockDateReturnValue);

      const result = parseApproveDeliverableExtensionInput(
        testInput,
        testDeliverableExtension as PrismaDeliverableExtension
      );
      expect(parseDateTimeOrLocalDateToEasternTZDate).toHaveBeenCalledExactlyOnceWith(
        testInput.newDueDate,
        "End of Day"
      );
      expect(checkInputDateIsEndOfDay).toHaveBeenCalledExactlyOnceWith(
        "dueDate",
        mockDateReturnValue
      );
      expect(parseJSDateToEasternTZDate).not.toHaveBeenCalled();
      expect(result).toStrictEqual({
        deliverableExtensionId: testInput.deliverableExtensionId,
        finalDateGranted: mockDateReturnValue,
      });
    });
  });
});
