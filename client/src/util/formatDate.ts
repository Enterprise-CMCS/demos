import { format } from "date-fns";

const ISO_DATE_FORMAT = "yyyy-MM-dd";
const US_DATE_FORMAT = "MM/dd/yyyy";

export function formatDate(date: Date): string {
  return format(date, US_DATE_FORMAT);
}

export function formatDateForServer(date: Date | string): string {
  return format(date, ISO_DATE_FORMAT);
}
