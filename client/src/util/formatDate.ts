/* eslint-disable no-nonstandard-date-formatting/no-nonstandard-date-formatting */
import { format } from "date-fns";

export function formatDate(date?: Date): string {
  return date ? format(date, "MM/dd/yyyy") : "--/--/----";
}

export function formatTimestamp(date?: Date): string {
  return date ? date.toISOString() : "--/--/---- --:--:--";
}

export function formatDateTime(date?: Date): string {
  return date ? format(date, "MM/dd/yyyy HH:mm") : "--/--/---- --:--";
}
