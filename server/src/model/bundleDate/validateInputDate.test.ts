import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateInputDate } from "./validateInputDate.js";
import { DateType, SetBundleDateInput } from "../../types.js";
import {
  checkInputDateIsStartOfDay,
  checkInputDateIsEndOfDay,
  checkInputDateGreaterThan,
  checkInputDateGreaterThanOrEqual,
  checkInputDateMeetsOffset,
  DateOffset,
} from "./checkInputDateFunctions.js";

vi.mock("./checkInputDateFunctions.js", () => ({
  checkInputDateIsStartOfDay: vi.fn(),
  checkInputDateIsEndOfDay: vi.fn(),
  checkInputDateGreaterThan: vi.fn(),
  checkInputDateGreaterThanOrEqual: vi.fn(),
  checkInputDateMeetsOffset: vi.fn(),
}));

function expectStartOfDay(testData: SetBundleDateInput) {
  const testInputDate = {
    dateType: testData.dateType,
    dateValue: testData.dateValue,
  };
  validateInputDate(testData);
  expect(checkInputDateIsStartOfDay).toHaveBeenCalledExactlyOnceWith(testInputDate);
}

function expectEndOfDay(testData: SetBundleDateInput) {
  const testInputDate = {
    dateType: testData.dateType,
    dateValue: testData.dateValue,
  };
  validateInputDate(testData);
  expect(checkInputDateIsEndOfDay).toHaveBeenCalledExactlyOnceWith(testInputDate);
}

async function expectRunCounts(testData: SetBundleDateInput, counts: number[]): Promise<void> {
  await validateInputDate(testData);
  expect(checkInputDateIsStartOfDay).toBeCalledTimes(counts[0]);
  expect(checkInputDateIsEndOfDay).toBeCalledTimes(counts[1]);
  expect(checkInputDateGreaterThan).toBeCalledTimes(counts[2]);
  expect(checkInputDateGreaterThanOrEqual).toBeCalledTimes(counts[3]);
  expect(checkInputDateMeetsOffset).toBeCalledTimes(counts[4]);
}

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
  testOffset: DateOffset
) {
  const testInputDate = {
    dateType: testData.dateType,
    dateValue: testData.dateValue,
  };
  await validateInputDate(testData);
  expect(checkInputDateMeetsOffset).toHaveBeenCalledExactlyOnceWith(testInputDate, {
    bundleId: testData.bundleId,
    dateType: testDateType,
    offset: testOffset,
  });
}

function makeStartOnlySuite(bundleId: string, dateType: DateType, dateValue: Date) {
  describe(dateType, () => {
    const testData: SetBundleDateInput = {
      bundleId: bundleId,
      dateType: dateType,
      dateValue: dateValue,
    };

    it("should call checkInputDateIsStartOfDay", () => {
      expectStartOfDay(testData);
    });

    it("should have correct call counts", async () => {
      await expectRunCounts(testData, [1, 0, 0, 0, 0]);
    });
  });
}

describe("validateInputDate", () => {
  const testDateValue: Date = new Date("2025-01-01T05:00:00Z");
  const testBundleId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  makeStartOnlySuite(testBundleId, "Concept Start Date", testDateValue);
  makeStartOnlySuite(testBundleId, "Pre-Submission Submitted Date", testDateValue);

  describe("Concept Completion Date", () => {
    const testData: SetBundleDateInput = {
      bundleId: testBundleId,
      dateType: "Concept Completion Date",
      dateValue: testDateValue,
    };

    it("should call checkInputDateIsStartOfDay", () => {
      expectStartOfDay(testData);
    });

    it("should call checkInputDateGreaterThan on Concept Start Date", async () => {
      await expectGreaterThan(testData, "Concept Start Date");
    });

    it("should have correct call counts", async () => {
      await expectRunCounts(testData, [1, 0, 1, 0, 0]);
    });
  });

  makeStartOnlySuite(testBundleId, "Application Intake Start Date", testDateValue);
  makeStartOnlySuite(testBundleId, "State Application Submitted Date", testDateValue);

  describe("Completeness Review Due Date", () => {
    const testData: SetBundleDateInput = {
      bundleId: testBundleId,
      dateType: "Completeness Review Due Date",
      dateValue: testDateValue,
    };

    it("should call checkInputDateIsEndOfDay", () => {
      expectEndOfDay(testData);
    });

    it("should call checkInputDateMeetsOffset on State Application Submitted Date with offset 15:23:59:59.999", async () => {
      await expectMeetsOffset(testData, "State Application Submitted Date", {
        days: 15,
        hours: 23,
        minutes: 59,
        seconds: 59,
        milliseconds: 999,
      });
    });

    it("should have correct call counts", async () => {
      await expectRunCounts(testData, [0, 1, 0, 0, 1]);
    });
  });

  describe("Application Intake Completion Date", () => {
    const testData: SetBundleDateInput = {
      bundleId: testBundleId,
      dateType: "Application Intake Completion Date",
      dateValue: testDateValue,
    };

    it("should call checkInputIsStartOfDay", () => {
      expectStartOfDay(testData);
    });

    it("should call checkInputDateGreaterThan on Application Intake Start Date", async () => {
      await expectGreaterThan(testData, "Application Intake Start Date");
    });

    it("should call checkInputDateGreaterThanOrEqual on Concept Completion Date", async () => {
      await expectGreaterThanOrEqual(testData, "Concept Completion Date");
    });

    it("should have correct call counts", async () => {
      await expectRunCounts(testData, [1, 0, 1, 1, 0]);
    });
  });

  makeStartOnlySuite(testBundleId, "Completeness Start Date", testDateValue);

  describe("State Application Deemed Complete", () => {
    const testData: SetBundleDateInput = {
      bundleId: testBundleId,
      dateType: "State Application Deemed Complete",
      dateValue: testDateValue,
    };

    it("should call checkInputDateIsStartOfDay", () => {
      expectStartOfDay(testData);
    });

    it("should call checkInputDateGreaterThan on State Application Submitted Date", async () => {
      await expectGreaterThan(testData, "State Application Submitted Date");
    });

    it("should have correct call counts", async () => {
      await expectRunCounts(testData, [1, 0, 1, 0, 0]);
    });
  });

  describe("Federal Comment Period Start Date", () => {
    const testData: SetBundleDateInput = {
      bundleId: testBundleId,
      dateType: "Federal Comment Period Start Date",
      dateValue: testDateValue,
    };

    it("should call checkInputDateIsStartOfDay", () => {
      expectStartOfDay(testData);
    });

    it("should call checkInputDateMeetsOffset on State Application Deemed Complete with offset 1:0:0:0.000", async () => {
      await expectMeetsOffset(testData, "State Application Deemed Complete", {
        days: 1,
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      });
    });

    it("should have correct call counts", async () => {
      await expectRunCounts(testData, [1, 0, 0, 0, 1]);
    });
  });

  describe("Federal Comment Period End Date", () => {
    const testData: SetBundleDateInput = {
      bundleId: testBundleId,
      dateType: "Federal Comment Period End Date",
      dateValue: testDateValue,
    };

    it("should call checkInputIsEndOfDay", () => {
      expectEndOfDay(testData);
    });

    it("should call checkInputDateMeetsOffset on Federal Comment Period Start Date with offset 30:23:59:59.999", async () => {
      await expectMeetsOffset(testData, "Federal Comment Period Start Date", {
        days: 30,
        hours: 23,
        minutes: 59,
        seconds: 59,
        milliseconds: 999,
      });
    });

    it("should have correct call counts", async () => {
      await expectRunCounts(testData, [0, 1, 0, 0, 1]);
    });
  });

  describe("Completeness Completion Date", () => {
    const testData: SetBundleDateInput = {
      bundleId: testBundleId,
      dateType: "Completeness Completion Date",
      dateValue: testDateValue,
    };

    it("should call checkInputDateIsStartOfDay", () => {
      expectStartOfDay(testData);
    });

    it("should call checkInputDateGreaterThan on Completeness Start Date", async () => {
      await expectGreaterThan(testData, "Completeness Start Date");
    });

    it("should call checkInputDateGreaterThanOrEqual on Application Intake Completion Date", async () => {
      await expectGreaterThanOrEqual(testData, "Application Intake Completion Date");
    });

    it("should have correct call counts", async () => {
      await expectRunCounts(testData, [1, 0, 1, 1, 0]);
    });
  });

  makeStartOnlySuite(testBundleId, "SDG Preparation Start Date", testDateValue);
  makeStartOnlySuite(testBundleId, "Expected Approval Date", testDateValue);
  makeStartOnlySuite(testBundleId, "SME Review Date", testDateValue);
  makeStartOnlySuite(testBundleId, "FRT Initial Meeting Date", testDateValue);
  makeStartOnlySuite(testBundleId, "BNPMT Initial Meeting Date", testDateValue);
  makeStartOnlySuite(testBundleId, "SDG Preparation Completion Date", testDateValue);
  makeStartOnlySuite(testBundleId, "OGC & OMB Review Start Date", testDateValue);
  makeStartOnlySuite(testBundleId, "OGC Review Complete", testDateValue);
  makeStartOnlySuite(testBundleId, "OMB Review Complete", testDateValue);
  makeStartOnlySuite(testBundleId, "PO & OGD Sign-Off", testDateValue);
  makeStartOnlySuite(testBundleId, "OGC & OMB Review Completion Date", testDateValue);
});
