import { format } from "date-fns";

export function renderDate(date: Date) {
  // eslint-disable-next-line no-nonstandard-date-rendering/no-nonstandard-date-rendering
  return format(date, "MM/dd/yyyy");
}

export function renderTimestamp(date: Date) {
  // eslint-disable-next-line no-nonstandard-date-rendering/no-nonstandard-date-rendering
  return date.toISOString();
}

export function renderDateTime(date: Date) {
  // eslint-disable-next-line no-nonstandard-date-rendering/no-nonstandard-date-rendering
  return format(date, "MM/dd/yyyy HH:mm");
}
