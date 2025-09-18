/* eslint-disable no-nonstandard-date-formatting/no-nonstandard-date-formatting */
import { format } from "date-fns";
import { UTCDate } from "@date-fns/utc";

type DateTimeGranularity = "minute" | "second" | "millisecond";

export function formatDate(utcDate: UTCDate): string {
  return format(utcDate, "MM/dd/yyyy");
}

export function formatDateAsIsoString(utcDate: UTCDate): string {
  return utcDate.toISOString();
}

export function formatDateTime(utcDate: UTCDate, granularity: DateTimeGranularity): string {
  switch (granularity) {
    case "minute":
      return format(utcDate, "MM/dd/yyyy HH:mm");
    case "second":
      return format(utcDate, "MM/dd/yyyy HH:mm:ss");
    case "millisecond":
      return format(utcDate, "MM/dd/yyyy HH:mm:ss.SSS");
    default:
      throw new Error("Invalid granularity");
  }
}
