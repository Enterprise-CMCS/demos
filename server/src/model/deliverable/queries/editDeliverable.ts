import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { DeliverableStatus, NonEmptyString } from "../../../types";

export type EditDeliverableInput = {
  name?: NonEmptyString;
  statusId?: DeliverableStatus;
  cmsOwnerUserId?: string;
  dueDate?: Date;
};

export async function editDeliverable(
  deliverableId: string,
  input: EditDeliverableInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverable> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.deliverable.update({
    where: {
      id: deliverableId,
    },
    data: { ...input },
  });
}
