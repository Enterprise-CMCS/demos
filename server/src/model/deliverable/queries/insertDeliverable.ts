import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient.js";
import { ParsedCreateDeliverableInput } from "..";
import { DeliverableStatus, DeliverableDueDateType, ApplicationStatus } from "../../../types";

export async function insertDeliverable(
  input: ParsedCreateDeliverableInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverable> {
  const prismaClient = tx ?? prisma();
  const userInfo = await prismaClient.user.findUniqueOrThrow({
    where: {
      id: input.cmsOwnerUserId,
    },
    select: {
      personTypeId: true,
    },
  });

  return await prismaClient.deliverable.create({
    data: {
      deliverableTypeId: input.deliverableType,
      name: input.name,
      demonstrationId: input.demonstrationId,
      demonstrationStatusId: "Approved" satisfies ApplicationStatus,
      statusId: "Upcoming" satisfies DeliverableStatus,
      cmsOwnerUserId: input.cmsOwnerUserId,
      cmsOwnerPersonTypeId: userInfo.personTypeId,
      dueDate: input.dueDate.easternTZDate,
      dueDateTypeId: "Normal" satisfies DeliverableDueDateType,
      expectedToBeSubmitted: true,
    },
  });
}
