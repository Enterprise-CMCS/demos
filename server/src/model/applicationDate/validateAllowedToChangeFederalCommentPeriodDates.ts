import type { ParsedApplicationDateInput, ParsedSetApplicationDatesInput } from ".";

export function validateAllowedToChangeFederalCommentPeriodDates(
  existingApplicationDates: ParsedApplicationDateInput[],
  inputApplicationDates: ParsedSetApplicationDatesInput
): void {
  const existingContainsStartDate = existingApplicationDates
    .map((applicationDate) => applicationDate.dateType)
    .some((applicationDate) => applicationDate === "Federal Comment Period Start Date");
  const existingContainsEndDate = existingApplicationDates
    .map((applicationDate) => applicationDate.dateType)
    .some((applicationDate) => applicationDate === "Federal Comment Period End Date");

  const inputContainsStartDate =
    inputApplicationDates.applicationDatesToUpsert
      .map((applicationDate) => applicationDate.dateType)
      .some((applicationDate) => applicationDate === "Federal Comment Period Start Date") ||
    inputApplicationDates.applicationDatesToDelete.includes("Federal Comment Period Start Date");
  const inputContainsEndDate =
    inputApplicationDates.applicationDatesToUpsert
      .map((applicationDate) => applicationDate.dateType)
      .some((applicationDate) => applicationDate === "Federal Comment Period End Date") ||
    inputApplicationDates.applicationDatesToDelete.includes("Federal Comment Period End Date");

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
