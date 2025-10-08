import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateInputDate } from "./validateInputDate.js";
import { DateType, SetBundleDateInput } from "../../types.js";
import {
  checkInputDateGreaterThan,
  checkInputDateGreaterThanOrEqual,
  checkInputDateMeetsOffset,
} from "./checkInputDateFunctions.js";

vi.mock("./checkInputDateFunctions.js", () => ({
  checkInputDateGreaterThan: vi.fn(),
  checkInputDateGreaterThanOrEqual: vi.fn(),
  checkInputDateMeetsOffset: vi.fn(),
}));

async function expectGreaterThan(testData: SetBundleDateInput, testDateType: DateType) {
  const testInputDate = {
    dateType: testData.dateType,
    dateValue: testData.dateValue,
  };
  await validateInputDate(testData);
  expect(checkInputDateGreaterThan).toHaveBeenCalledExactlyOnceWith(testInputDate, {
    bundleId: testData.bundleId,
    dateType: testDateType,
  });
}

async function expectGreaterThanOrEqual(testData: SetBundleDateInput, testDateType: DateType) {
  const testInputDate = {
    dateType: testData.dateType,
    dateValue: testData.dateValue,
  };
  await validateInputDate(testData);
  expect(checkInputDateGreaterThanOrEqual).toHaveBeenCalledExactlyOnceWith(testInputDate, {
    bundleId: testData.bundleId,
    dateType: testDateType,
  });
}

async function expectMeetsOffset(
  testData: SetBundleDateInput,
  testDateType: DateType,
  testOffsetDays: number
) {
  const testInputDate = {
    dateType: testData.dateType,
    dateValue: testData.dateValue,
  };
  await validateInputDate(testData);
  expect(checkInputDateMeetsOffset).toHaveBeenCalledExactlyOnceWith(testInputDate, {
    bundleId: testData.bundleId,
    dateType: testDateType,
    offsetDays: testOffsetDays,
  });
}

describe("validateInputDate", () => {
  const testDateValue: Date = new Date("2025-01-01T00:00:00Z");
  const testBundleId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("Concept Completion Date", () => {
    const testData: SetBundleDateInput = {
      bundleId: testBundleId,
      dateType: "Concept Completion Date",
      dateValue: testDateValue,
    };

    it("should check greater than Concept Start Date", async () => {
      await expectGreaterThan(testData, "Concept Start Date");
    });
  });

  describe("State Application Completion Date", () => {
    const testData: SetBundleDateInput = {
      bundleId: testBundleId,
      dateType: "State Application Completion Date",
      dateValue: testDateValue,
    };

    it("should check greater than State Application Start Date", async () => {
      await expectGreaterThan(testData, "State Application Start Date");
    });

    it("should check greater than or equal to Concept Completion Date", async () => {
      await expectGreaterThanOrEqual(testData, "Concept Completion Date");
    });
  });

  describe("Completeness Completion Date", () => {
    const testData: SetBundleDateInput = {
      bundleId: testBundleId,
      dateType: "Completeness Completion Date",
      dateValue: testDateValue,
    };

    it("should check greater than Completeness Start Date", async () => {
      await expectGreaterThan(testData, "Completeness Start Date");
    });

    it("should check greater than or equal to State Application Completion Date", async () => {
      await expectGreaterThanOrEqual(testData, "State Application Completion Date");
    });
  });

  describe("State Application Deemed Complete", () => {
    const testData: SetBundleDateInput = {
      bundleId: testBundleId,
      dateType: "State Application Deemed Complete",
      dateValue: testDateValue,
    };

    it("should check greater than State Application Submitted Date", async () => {
      await expectGreaterThan(testData, "State Application Submitted Date");
    });
  });

  describe("Completeness Review Due Date", () => {
    const testData: SetBundleDateInput = {
      bundleId: testBundleId,
      dateType: "Completeness Review Due Date",
      dateValue: testDateValue,
    };

    it("should check is equal to State Application Submitted Date plus 15", async () => {
      await expectMeetsOffset(testData, "State Application Submitted Date", 15);
    });
  });

  describe("Federal Comment Period Start Date", () => {
    const testData: SetBundleDateInput = {
      bundleId: testBundleId,
      dateType: "Federal Comment Period Start Date",
      dateValue: testDateValue,
    };

    it("should check is equal to State Application Deemed Complete plus 1", async () => {
      await expectMeetsOffset(testData, "State Application Deemed Complete", 1);
    });
  });

  describe("Federal Comment Period End Date", () => {
    const testData: SetBundleDateInput = {
      bundleId: testBundleId,
      dateType: "Federal Comment Period End Date",
      dateValue: testDateValue,
    };

    it("should check is equal to Federal Comment Period Start Date plus 30", async () => {
      await expectMeetsOffset(testData, "Federal Comment Period Start Date", 30);
    });
  });

  describe("Other Dates", () => {
    const testData: SetBundleDateInput = {
      bundleId: testBundleId,
      dateType: "FRT Initial Meeting Date",
      dateValue: testDateValue,
    };

    it("should do nothing if the date is not one of the validated dates", async () => {
      await validateInputDate(testData);
      expect(checkInputDateGreaterThan).not.toBeCalled();
      expect(checkInputDateGreaterThanOrEqual).not.toBeCalled();
      expect(checkInputDateMeetsOffset).not.toBeCalled();
    });
  });
});
