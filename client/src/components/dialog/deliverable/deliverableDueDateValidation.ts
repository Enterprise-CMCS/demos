import { isBefore, parseISO } from "date-fns";

import { getTodayEst } from "util/formatDate";

export const dueDateIsTodayOrFuture = (dueDate: string): boolean =>
  dueDate.length > 0 && !isBefore(parseISO(dueDate), parseISO(getTodayEst()));
