import { DeliverableActionType, DeliverableStatus } from "../../types";

export type DeliverableAction = {
  deliverableId: string;
  actionType: DeliverableActionType;
  actionTime: Date;
  oldStatus: DeliverableStatus;
  newStatus: DeliverableStatus;
  oldDueDate: Date;
  newDueDate: Date;
  note?: string;
  userId?: string;
};
