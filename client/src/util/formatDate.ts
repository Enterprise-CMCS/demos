import { getEndOfDayEST } from "components/application/dates/applicationDates";
/* eslint-disable no-nonstandard-date-formatting/no-nonstandard-date-formatting */
import { format, parseISO } from "date-fns";

type DateTimeGranularity = "minute" | "second" | "millisecond";

export function formatDate(date: Date): string {
  return format(date, "MM/dd/yyyy");
}

export function formatDateForServer(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseInputDate(value: string): Date {
  return parseISO(value);
}

export function parseInputDateAsEndOfDayEST(value: string): Date {
  const date = parseISO(value);
  const year = date.getFullYear();
  const month = date.getMonth(); // Note: getMonth() returns 0-11, which is what getEndOfDayEST expects
  const day = date.getDate();
  return getEndOfDayEST(year, month, day);
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

export function safeDateFormat(date: Date | string | null | undefined): string {
  if (!date) return "--/--/----";

  try {
    if (typeof date === "string") {
      const datePart = date.includes("T") ? date.split("T")[0] : date;
      const parts = datePart.split("-");

      if (parts.length !== 3) return "--/--/----";
      const [year, month, day] = parts;
      if (
        !year ||
        !month ||
        !day ||
        isNaN(Number(year)) ||
        isNaN(Number(month)) ||
        isNaN(Number(day))
      ) {
        return "--/--/----";
      }

      return `${month}/${day}/${year}`;
    }

    if (date instanceof Date) {
      const isoString = date.toISOString();
      const datePart = isoString.split("T")[0];
      const [year, month, day] = datePart.split("-");
      return `${month}/${day}/${year}`;
    }

    return "--/--/----";
  } catch {
    return "--/--/----";
  }
}
