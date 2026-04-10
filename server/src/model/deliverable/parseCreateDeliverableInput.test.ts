// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TZDate } from "@date-fns/tz";

// Types
import { CreateDeliverableInput, DateTimeOrLocalDate } from "../../types";
import { ParsedCreateDeliverableInput } from ".";

// Functions under test
import { parseCreateDeliverableInput } from "./parseCreateDeliverableInput";

// Mock imports
vi.mock("../../dateUtilities", () => ({
  parseDateTimeOrLocalDateToEasternTZDate: vi.fn(),
}));

vi.mock("../applicationDate", () => ({
  checkInputDateIsEndOfDay: vi.fn(),
}));

import { EasternTZDate, parseDateTimeOrLocalDateToEasternTZDate } from "../../dateUtilities";
import { checkInputDateIsEndOfDay } from "../applicationDate";

describe("parseCreateDeliverableInput", () => {
  const testInput: CreateDeliverableInput = {
    name: "A new deliverable name!",
    deliverableType: "HCBS Deficiency, Remediation and A/N/E Incident Report (1915(c)-like)",
    demonstrationId: "2bc27502-c286-4e1a-a5a5-3a45ad441149",
    dueDate: "2024-11-13" as DateTimeOrLocalDate,
    demonstrationTypes: ["Free Insulin"],
  };
  const mockParsedDate: EasternTZDate = {
    isEasternTZDate: true,
    easternTZDate: new TZDate(2024, 10, 13, 23, 59, 59, 999, "America/New_York"),
  };
  const testUserId = "3071585a-c2c8-4839-8c7c-24f5c9559b6c";
  const expectedResult: ParsedCreateDeliverableInput = {
    name: testInput.name,
    deliverableType: testInput.deliverableType,
    demonstrationId: testInput.demonstrationId,
    cmsOwnerUserId: testUserId,
    dueDate: mockParsedDate,
    demonstrationTypes: testInput.demonstrationTypes,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(parseDateTimeOrLocalDateToEasternTZDate).mockReturnValue(mockParsedDate);
  });

  it("should parse the input, check the dates, and return the updated object", () => {
    const result = parseCreateDeliverableInput(testInput, testUserId);
    expect(parseDateTimeOrLocalDateToEasternTZDate).toHaveBeenCalledExactlyOnceWith(
      testInput.dueDate,
      "End of Day"
    );
    expect(checkInputDateIsEndOfDay).toHaveBeenCalledExactlyOnceWith("dueDate", mockParsedDate);
    expect(result).toStrictEqual(expectedResult);
  });
});
