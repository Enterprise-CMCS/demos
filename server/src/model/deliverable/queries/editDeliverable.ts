import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { DeliverableStatus, NonEmptyString, PersonType } from "../../../types";

export type EditDeliverableInput = {
  name?: NonEmptyString;
  statusId?: DeliverableStatus;
  cmsOwner?: {
    cmsOwnerUserId: string;
    cmsOwnerPersonTypeId: PersonType;
  };
  dueDate?: Date;
};

export async function editDeliverable(
  deliverableId: string,
  input: EditDeliverableInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverable> {
  const { cmsOwner, ...basicInput } = input;
  const prismaClient = tx ?? prisma();
  return await prismaClient.deliverable.update({
    where: {
      id: deliverableId,
    },
    data: { ...basicInput, ...cmsOwner },
  });
}
