import { getEndOfDayEST } from "components/application/dates/applicationDates";
import { parseISO } from "date-fns";

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
