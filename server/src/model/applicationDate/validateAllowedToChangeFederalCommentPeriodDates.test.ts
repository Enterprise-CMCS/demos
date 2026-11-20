// Vitest and other helpers
import { describe, it, expect } from "vitest";
import { TZDate } from "@date-fns/tz";

// Types
import type { ParsedApplicationDateInput, ParsedSetApplicationDatesInput } from ".";
import type { EasternTZDate } from "../../dateUtilities";

// Functions under test
import { validateAllowedToChangeFederalCommentPeriodDates } from "./validateAllowedToChangeFederalCommentPeriodDates";

// Mock imports
// None

describe("validateAllowedToChangeFederalCommentPeriodDates", () => {
  const testDateValue: EasternTZDate = {
    easternTZDate: new TZDate("2027-01-13T00:00:00.000-05:00", "America/New_York"),
    isEasternTZDate: true,
  };
  const testApplicationId = "test-app-1";

  const allowedCases: {
    name: string;
    existingDates: ParsedApplicationDateInput[];
    inputDates: ParsedSetApplicationDatesInput;
  }[] = [
    {
      name: "should not throw if the federal comment period dates are not present anywhere",
      existingDates: [
        {
          dateType: "Application Approval Date",
          dateValue: testDateValue,
        },
      ],
      inputDates: {
        applicationId: testApplicationId,
        applicationDatesToUpsert: [
          { dateType: "Application Intake Start Date", dateValue: testDateValue },
        ],
        applicationDatesToDelete: ["BNPMT Initial Meeting Date"],
      },
    },
    {
      name: "should not throw if the federal comment period dates are only present in the existing dates",
      existingDates: [
        {
          dateType: "Federal Comment Period Start Date",
          dateValue: testDateValue,
        },
      ],
      inputDates: {
        applicationId: testApplicationId,
        applicationDatesToUpsert: [
          { dateType: "Application Intake Start Date", dateValue: testDateValue },
        ],
        applicationDatesToDelete: ["BNPMT Initial Meeting Date"],
      },
    },
    {
      name: "should not throw if the federal comment period dates are present only on the input dates",
      existingDates: [
        {
          dateType: "Application Approval Date",
          dateValue: testDateValue,
        },
      ],
      inputDates: {
        applicationId: testApplicationId,
        applicationDatesToUpsert: [
          { dateType: "Federal Comment Period Start Date", dateValue: testDateValue },
        ],
        applicationDatesToDelete: ["BNPMT Initial Meeting Date"],
      },
    },
    {
      name: "should not throw if a start date is present in one set and an end date is present in the other",
      existingDates: [
        {
          dateType: "Federal Comment Period Start Date",
          dateValue: testDateValue,
        },
      ],
      inputDates: {
        applicationId: testApplicationId,
        applicationDatesToUpsert: [
          { dateType: "FRT Initial Meeting Date", dateValue: testDateValue },
        ],
        applicationDatesToDelete: ["Federal Comment Period End Date"],
      },
    },
  ];

  for (const { name, existingDates, inputDates } of allowedCases) {
    it(name, () => {
      expect(() =>
        validateAllowedToChangeFederalCommentPeriodDates(existingDates, inputDates)
      ).not.toThrow();
    });
  }

  const rejectedCases: {
    name: string;
    existingDates: ParsedApplicationDateInput[];
    inputDates: ParsedSetApplicationDatesInput;
  }[] = [
    {
      name: "should throw if trying to delete a Federal Comment Period Start Date that already exists",
      existingDates: [
        {
          dateType: "Federal Comment Period Start Date",
          dateValue: testDateValue,
        },
      ],
      inputDates: {
        applicationId: testApplicationId,
        applicationDatesToUpsert: [],
        applicationDatesToDelete: ["Federal Comment Period Start Date"],
      },
    },
    {
      name: "should throw if trying to upsert a Federal Comment Period Start Date that already exists",
      existingDates: [
        {
          dateType: "Federal Comment Period Start Date",
          dateValue: testDateValue,
        },
      ],
      inputDates: {
        applicationId: testApplicationId,
        applicationDatesToUpsert: [
          {
            dateType: "Federal Comment Period Start Date",
            dateValue: testDateValue,
          },
        ],
        applicationDatesToDelete: [],
      },
    },
    {
      name: "should throw if trying to delete a Federal Comment Period End Date that already exists",
      existingDates: [
        {
          dateType: "Federal Comment Period End Date",
          dateValue: testDateValue,
        },
      ],
      inputDates: {
        applicationId: testApplicationId,
        applicationDatesToUpsert: [],
        applicationDatesToDelete: ["Federal Comment Period End Date"],
      },
    },
    {
      name: "should throw if trying to upsert a Federal Comment Period End Date that already exists",
      existingDates: [
        {
          dateType: "Federal Comment Period End Date",
          dateValue: testDateValue,
        },
      ],
      inputDates: {
        applicationId: testApplicationId,
        applicationDatesToUpsert: [
          {
            dateType: "Federal Comment Period End Date",
            dateValue: testDateValue,
          },
        ],
        applicationDatesToDelete: [],
      },
    },
  ];
  const expectedErrorMessage =
    "The Federal Comment Period Start Date and Federal Comment Period End Date " +
    "cannot be modified once set.";

  for (const { name, existingDates, inputDates } of rejectedCases) {
    it(name, () => {
      expect(() =>
        validateAllowedToChangeFederalCommentPeriodDates(existingDates, inputDates)
      ).toThrow(expectedErrorMessage);
    });
  }
});
