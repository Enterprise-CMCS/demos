import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { UpdateDeliverableInput } from "../../../types";

// Note: name is unusual to avoid collision with updateDeliverable function
export async function prismaUpdateDeliverable(
  deliverableId: string,
  input: UpdateDeliverableInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverable> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.deliverable.update({
    where: {
      id: deliverableId,
    },
    data: {
      deliverableTypeId: input.deliverableType,
      name: input.name,
      cmsOwnerUserId: input.cmsOwnerUserId,
      dueDate: input.dueDate,
    },
  });
}
