import { addDays } from "date-fns";
import { DatesInput } from "../types";
import { DATE_TYPES } from "../../constants";

export const generateSampleDateData = ({ approvalDate }: { approvalDate: Date }): DatesInput => {
  let daysAgo = 0;

  return DATE_TYPES.slice()
    .reverse()
    .reduce((dates, dateType) => {
      dates[dateType] =
        dateType === "Federal Comment Period End Date"
          ? addDays(approvalDate, (daysAgo -= 30))
          : addDays(approvalDate, daysAgo--);

      return dates;
    }, {} as DatesInput);
};
