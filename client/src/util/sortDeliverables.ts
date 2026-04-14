import { DELIVERABLE_STATUSES } from "demos-server-constants";

type SortableDeliverable = {
  id: string;
  status: string;
  dueDate: string | Date;
};

const STATUS_ORDER = [
  "Past Due",
  "Upcoming",
  "Submitted",
  "Under CMS Review",
  "Approved",
  "Accepted",
  "Received and Filed",
] as const;

const STATUS_RANK = new Map(
  DELIVERABLE_STATUSES.map((status, index) => [status, 100 + index])
);

STATUS_ORDER.forEach((status, index) => {
  STATUS_RANK.set(status, index);
});

const dateToTimestamp = (date: string | Date): number => {
  const value = date instanceof Date ? date.getTime() : Date.parse(date);
  return Number.isNaN(value) ? Number.NaN : value;
};

const compareDueDateAsc = (firstDate: string | Date, secondDate: string | Date) => {
  const firstTime = dateToTimestamp(firstDate);
  const secondTime = dateToTimestamp(secondDate);

  if (!Number.isNaN(firstTime) && !Number.isNaN(secondTime)) {
    return firstTime - secondTime;
  }

  return String(firstDate).localeCompare(String(secondDate));
};

export const sortDeliverablesByDefault = <T extends SortableDeliverable>(
  deliverables: T[]
): T[] => {
  return [...deliverables].sort((firstDel, secondDel) => {
    const dueDateCompare = compareDueDateAsc(firstDel.dueDate, secondDel.dueDate);

    const aRank = STATUS_RANK.get(firstDel.status as typeof STATUS_ORDER[number]) ?? Number.MAX_SAFE_INTEGER;
    const bRank = STATUS_RANK.get(secondDel.status as typeof STATUS_ORDER[number]) ?? Number.MAX_SAFE_INTEGER;

    if (aRank !== bRank) {
      return aRank - bRank;
    }

    return dueDateCompare || firstDel.id.localeCompare(secondDel.id);
  });
};
