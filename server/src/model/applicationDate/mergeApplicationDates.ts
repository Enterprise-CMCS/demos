import { ParsedApplicationDateInput } from "../../types.js";

export function mergeApplicationDates(
  existingDates: ParsedApplicationDateInput[],
  newDates: ParsedApplicationDateInput[]
): ParsedApplicationDateInput[] {
  const resultDateMap = new Map(
    existingDates.map((existingDate) => [existingDate.dateType, existingDate])
  );
  newDates.forEach((newDate) => resultDateMap.set(newDate.dateType, newDate));
  return Array.from(resultDateMap.values());
}
