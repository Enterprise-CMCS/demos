/* eslint-disable no-nonstandard-date-formatting/no-nonstandard-date-formatting */
import { getEndOfDayEST } from "components/application/dates/applicationDates";
import { parseISO } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";

export function parseInputDate(value: string): Date {
  return parseISO(value);
}

export function parseInputDateAsEndOfDayEST(value: string): Date {
  const date = parseISO(value);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  return getEndOfDayEST(year, month, day);
}

export function parseInputDateAsStartOfDayEST(value: string): string {
  const [year, month, day] = value.split("-");
  const date = new TZDate(
    Number(year),
    Number(month) - 1,
    Number(day),
    0,
    0,
    0,
    0,
    "America/New_York"
  );
  return format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
}
