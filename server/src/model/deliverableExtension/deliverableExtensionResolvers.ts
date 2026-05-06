import { DeliverableExtension as PrismaDeliverableExtension } from "@prisma/client";
import {
  DeliverableExtensionReasonCode,
  DeliverableExtensionStatus,
  NonEmptyString,
} from "../../types";
import { selectDeliverableAction } from "../deliverableAction/queries";

export const deliverableExtensionResolvers = {
  DeliverableExtension: {
    status: (parent: PrismaDeliverableExtension): DeliverableExtensionStatus => {
      return parent.statusId as DeliverableExtensionStatus;
    },
    reasonCode: (parent: PrismaDeliverableExtension): DeliverableExtensionReasonCode => {
      return parent.reasonCodeId as DeliverableExtensionReasonCode;
    },
    reasonDetails: async (parent: PrismaDeliverableExtension): Promise<NonEmptyString> => {
      const result = await selectDeliverableAction(
        {
          deliverableId: parent.deliverableId,
          activeExtensionId: parent.id,
          actionTypeId: "Requested Extension",
        },
        true
      );
      // Note is guaranteed to exist by database in this case
      return result.note!;
    },
    initialDueDateAtRequest: async (parent: PrismaDeliverableExtension): Promise<Date> => {
      const result = await selectDeliverableAction(
        {
          deliverableId: parent.deliverableId,
          activeExtensionId: parent.id,
          actionTypeId: "Requested Extension",
        },
        true
      );
      // Both old and new due dates will be the same, just using old by convention
      return result.oldDueDate;
    },
  },
};
