import { isBefore, parseISO } from "date-fns";
import { formatDateForDisplay, getTodayEst } from "util/formatDate";
// Temporary until we get datepicker fix tested. then we'lll use minDate=`{getTodayEst()}`
// This is just a third location for SingeDueDate and QuarterlyDueDate, will get replaced once datepicker fixed

export const dueDateIsTodayOrFuture = (dueDate: string): boolean =>
  dueDate.length > 0 && !isBefore(parseISO(dueDate), parseISO(getTodayEst()));

export const getDueDateValidationMessage = (dueDate: string): string =>
  dueDate.length > 0 && !dueDateIsTodayOrFuture(dueDate)
    ? `Date must be on or after ${formatDateForDisplay(getTodayEst())}.`
    : "";
