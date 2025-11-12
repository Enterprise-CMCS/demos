import { parseISO } from "date-fns";

export function parseInputDate(value: string): Date {
  return parseISO(value);
}
