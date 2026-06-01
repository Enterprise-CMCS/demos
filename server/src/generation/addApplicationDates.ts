import { TZDate } from "@date-fns/tz";
import { DateType } from "../constants";
import { formatEasternTZDateToMMDDYYYY, parseJSDateToEasternTZDate } from "../dateUtilities";
import { LocalDate } from "../types";
import { applicationDateResolvers } from "../model/applicationDate/applicationDateResolvers";

export const addApplicationDates = async ({
  applicationId,
  dates,
}: {
  applicationId: string;
  dates: {
    dateType: DateType;
    dateValue: TZDate;
  }[];
}) => {
  await applicationDateResolvers.Mutation.setApplicationDates(null, {
    input: {
      applicationId,
      applicationDates: dates.map((date) => ({
        dateType: date.dateType,
        dateValue: formatEasternTZDateToMMDDYYYY(
          parseJSDateToEasternTZDate(date.dateValue)
        ) as LocalDate,
      })),
    },
  });
};
