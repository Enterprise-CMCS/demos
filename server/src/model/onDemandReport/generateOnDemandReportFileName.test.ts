// Vitest and other helpers
import { describe, it, expect } from "vitest";
import { TZDate } from "@date-fns/tz";

// Types
import type { OnDemandReportType } from "../../types";
import type { EasternNow } from "../../dateUtilities";

// Functions under test
import { generateOnDemandReportFileName } from "./generateOnDemandReportFileName";

// Mock imports

describe("generateOnDemandReportFileName", () => {
  const testGeneratedDate: Partial<EasternNow> = {
    "Current Time": {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2026, 5, 23, 11, 19, 42, 111, "America/New_York"),
    },
  };
  const expectedDatePart = "20260623_111942_ET";
  const expectedResults: [OnDemandReportType, string][] = [
    ["Basic Test Report", `Basic_Test_Report_${expectedDatePart}`],
    ["Application Details Report", `Application_Details_Report_${expectedDatePart}`],
    ["Deliverable Status Report", `Deliverable_Status_Report_${expectedDatePart}`],
    ["Demonstration Overview Report", `Demonstration_Overview_Report_${expectedDatePart}`],
    ["Demonstration Types Report", `Demonstration_Types_Report_${expectedDatePart}`],
  ];

  it.each(expectedResults)("returns the correct file name for '%s'", (reportType, expectedName) => {
    const result = generateOnDemandReportFileName(reportType, testGeneratedDate as EasternNow);
    expect(result).toBe(expectedName);
  });
});
