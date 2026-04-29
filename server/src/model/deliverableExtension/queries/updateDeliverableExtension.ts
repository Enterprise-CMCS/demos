import { DeliverableExtension as PrismaDeliverableExtension } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { DeliverableExtensionStatus } from "../../../types";

export type UpdateDeliverableExtensionInput = {
  statusId?: DeliverableExtensionStatus;
  finalDateGranted?: Date;
};

export async function updateDeliverableExtension(
  deliverableExtensionId: string,
  input: UpdateDeliverableExtensionInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverableExtension> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.deliverableExtension.update({
    where: {
      id: deliverableExtensionId,
    },
    data: {
      ...input,
    },
  });
}
