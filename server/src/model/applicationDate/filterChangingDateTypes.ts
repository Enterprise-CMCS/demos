import { ApplicationDate as PrismaApplicationDate } from "@prisma/client";
import { ApplicationDateInput } from "./applicationDateSchema";
import { DateType } from "../../types";
import { parseDateTimeOrLocalDateToEasternTZDate } from "../../dateUtilities";
import { DATE_TYPES_WITH_EXPECTED_TIMESTAMPS } from "../../constants";

export const filterChangingDateTypes = (
  inputApplicationDates: ApplicationDateInput[],
  existingApplicationDates: Pick<PrismaApplicationDate, "dateTypeId" | "dateValue">[]
): DateType[] => {
  return inputApplicationDates
    .filter((inputApplicationDate) => {
      const existingApplicationDate = existingApplicationDates.find(
        (appDate) => appDate.dateTypeId === inputApplicationDate.dateType
      );

      // If there is no existing date, or the input dateValue is null, it's a change
      // (cannot delete non-existing date)
      if (!existingApplicationDate || !inputApplicationDate.dateValue) return true;

      return (
        existingApplicationDate.dateValue.getTime() !==
        parseDateTimeOrLocalDateToEasternTZDate(
          inputApplicationDate.dateValue,
          DATE_TYPES_WITH_EXPECTED_TIMESTAMPS[inputApplicationDate.dateType].expectedTimestamp
        ).easternTZDate.getTime()
      );
    })
    .map((date) => date.dateType);
};
