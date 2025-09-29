/* eslint-disable no-nonstandard-date-formatting/no-nonstandard-date-formatting */
import { format, parseISO } from "date-fns";

type DateTimeGranularity = "minute" | "second" | "millisecond";

export function formatDate(date: Date): string {
  return format(date, "MM/dd/yyyy");
}

export function parseInputDate(value?: string): Date | undefined {
  if (!value) {
    console.log("value", value);
    return undefined;
  }
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function formatDateAsIsoString(date: Date): string {
  return date.toISOString();
}

export function formatDateTime(date: Date, granularity: DateTimeGranularity): string {
  switch (granularity) {
    case "minute":
      return format(date, "MM/dd/yyyy HH:mm");
    case "second":
      return format(date, "MM/dd/yyyy HH:mm:ss");
    case "millisecond":
      return format(date, "MM/dd/yyyy HH:mm:ss.SSS");
  }
}
