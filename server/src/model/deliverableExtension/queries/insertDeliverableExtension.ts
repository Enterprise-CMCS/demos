import { DeliverableExtension as PrismaDeliverableExtension } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { DeliverableExtensionReasonCode, DeliverableExtensionStatus } from "../../../types";

export type InsertDeliverableExtensionInput = {
  deliverableId: string;
  reasonCode: DeliverableExtensionReasonCode;
  requestedDate: Date;
};

export async function insertDeliverableExtension(
  input: InsertDeliverableExtensionInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverableExtension> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.deliverableExtension.create({
    data: {
      deliverableId: input.deliverableId,
      statusId: "Requested" satisfies DeliverableExtensionStatus,
      reasonCodeId: input.reasonCode,
      originalDateRequested: input.requestedDate,
    },
  });
}
