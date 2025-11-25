import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { LocalDate } from "demos-server";

type DateArgument = Date | string | number;

const ISO_DATE_FORMAT = "yyyy-MM-dd";
const US_DATE_FORMAT = "MM/dd/yyyy";

/**
 * Formats a date to MM/DD/YYYY
 */
export const formatDate = (date: DateArgument): string => {
  return format(date, US_DATE_FORMAT);
};

/**
 * Formats a date to YYYY-MM-DD
 */
export const formatDateForServer = (date: DateArgument): LocalDate => {
  return format(date, ISO_DATE_FORMAT) as LocalDate;
};

/**
 * Gets today's date in Eastern Time in YYYY-MM-DD format
 */
export const getTodayEst = (): LocalDate => {
  const nowInET = new TZDate(Date.now(), "America/New_York");
  return formatDateForServer(nowInET);
};
