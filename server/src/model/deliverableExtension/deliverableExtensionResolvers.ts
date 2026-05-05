import { DeliverableExtension as PrismaDeliverableExtension } from "@prisma/client";
import { DeliverableExtensionReasonCode, DeliverableExtensionStatus } from "../../types";

export const deliverableExtensionResolvers = {
  DeliverableExtension: {
    status: (parent: PrismaDeliverableExtension): DeliverableExtensionStatus => {
      return parent.statusId as DeliverableExtensionStatus;
    },
    reasonCode: (parent: PrismaDeliverableExtension): DeliverableExtensionReasonCode => {
      return parent.reasonCodeId as DeliverableExtensionReasonCode;
    },
  },
};
