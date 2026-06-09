import { formatEasternTZDateToMMDDYYYY, parseJSDateToEasternTZDate } from "../../dateUtilities";
import { DateType, LocalDate } from "../../types";
import { applicationDateResolvers } from "../../model/applicationDate/applicationDateResolvers";
import { DatesInput } from "../types";

export const addApplicationDates = async <TDateType extends DateType>({
  dates,
  applicationId,
}: {
  dates: DatesInput<TDateType>;
  applicationId: string;
}) => {
  const applicationDates = [];
  for (const dateType in dates) {
    applicationDates.push({
      dateType: dateType as TDateType,
      dateValue: formatEasternTZDateToMMDDYYYY(
        parseJSDateToEasternTZDate(dates[dateType])
      ) as LocalDate,
    });
  }
  await applicationDateResolvers.Mutation.setApplicationDates(null, {
    input: { applicationId, applicationDates },
  });
};
