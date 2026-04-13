import { DELIVERABLE_STATUSES } from "demos-server-constants";

type SortableDeliverable = {
  id: string;
  status: string;
  dueDate: string;
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

const compareDueDateAsc = (firstDate: string, secondDate: string) => {
  const firstTime = Date.parse(firstDate);
  const secondTime = Date.parse(secondDate);

  if (!Number.isNaN(firstTime) && !Number.isNaN(secondTime)) {
    return firstTime - secondTime;
  }

  return firstDate.localeCompare(secondDate);
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
