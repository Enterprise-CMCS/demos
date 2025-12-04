import { ParsedApplicationDateInput } from ".";
import { DateType } from "../../types.js";

export function mergeApplicationDates(
  existingDates: ParsedApplicationDateInput[],
  newDates: ParsedApplicationDateInput[],
  datesToDelete: DateType[]
): ParsedApplicationDateInput[] {
  const resultDateMap = new Map(
    existingDates.map((existingDate) => [existingDate.dateType, existingDate])
  );
  newDates.forEach((newDate) => resultDateMap.set(newDate.dateType, newDate));
  datesToDelete.forEach((dateType) => resultDateMap.delete(dateType));
  return Array.from(resultDateMap.values());
}
