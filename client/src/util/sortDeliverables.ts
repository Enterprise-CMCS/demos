type SortableDeliverable = {
  id: string;
  status: string;
  dueDate: string;
  extensionRequested?: boolean;
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

const STATUS_RANK = new Map(STATUS_ORDER.map((status, index) => [status, index]));

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
  return [...deliverables].sort((firstDate, secondDate) => {
    const aExtensionRequested = firstDate.extensionRequested ?? false;
    const bExtensionRequested = secondDate.extensionRequested ?? false;

    if (aExtensionRequested !== bExtensionRequested) {
      return aExtensionRequested ? -1 : 1;
    }

    const dueDateCompare = compareDueDateAsc(firstDate.dueDate, secondDate.dueDate);

    if (aExtensionRequested && bExtensionRequested) {
      return dueDateCompare || firstDate.id.localeCompare(secondDate.id);
    }

    const aRank = STATUS_RANK.get(firstDate.status) ?? Number.MAX_SAFE_INTEGER;
    const bRank = STATUS_RANK.get(secondDate.status) ?? Number.MAX_SAFE_INTEGER;

    if (aRank !== bRank) {
      return aRank - bRank;
    }

    return dueDateCompare || firstDate.id.localeCompare(secondDate.id);
  });
};
