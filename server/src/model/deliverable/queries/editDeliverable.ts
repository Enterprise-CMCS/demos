import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { ParsedUpdateDeliverableInput } from "..";

export async function editDeliverable(
  deliverableId: string,
  input: ParsedUpdateDeliverableInput,
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
      dueDate: input.dueDate?.newDueDate.easternTZDate,
    },
  });
}
