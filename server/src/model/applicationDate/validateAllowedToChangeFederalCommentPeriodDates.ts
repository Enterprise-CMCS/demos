import type { ParsedApplicationDateInput, ParsedSetApplicationDatesInput } from ".";
import type { DateType } from "../../types";

export function parsedInputHasFederalCommentDate(
  inputApplicationDates: ParsedSetApplicationDatesInput,
  whichDate: Extract<
    DateType,
    "Federal Comment Period Start Date" | "Federal Comment Period End Date"
  >
): boolean {
  return (
    inputApplicationDates.applicationDatesToUpsert
      .map((applicationDate) => applicationDate.dateType)
      .includes(whichDate) || inputApplicationDates.applicationDatesToDelete.includes(whichDate)
  );
}

export function validateAllowedToChangeFederalCommentPeriodDates(
  existingApplicationDates: ParsedApplicationDateInput[],
  inputApplicationDates: ParsedSetApplicationDatesInput
): void {
  const existingContainsStartDate = existingApplicationDates
    .map((applicationDate) => applicationDate.dateType)
    .includes("Federal Comment Period Start Date");
  const existingContainsEndDate = existingApplicationDates
    .map((applicationDate) => applicationDate.dateType)
    .includes("Federal Comment Period End Date");

  const inputContainsStartDate = parsedInputHasFederalCommentDate(
    inputApplicationDates,
    "Federal Comment Period Start Date"
  );
  const inputContainsEndDate = parsedInputHasFederalCommentDate(
    inputApplicationDates,
    "Federal Comment Period End Date"
  );

  if (
    (existingContainsStartDate && inputContainsStartDate) ||
    (existingContainsEndDate && inputContainsEndDate)
  ) {
    throw new Error(
      "The Federal Comment Period Start Date and Federal Comment Period End Date " +
        "cannot be modified once set."
    );
  }
}
