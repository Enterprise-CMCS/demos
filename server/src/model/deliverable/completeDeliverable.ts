import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { GraphQLContext } from "../../auth";
import { DeliverableStatus, FinalDeliverableStatus, DeliverableActionType } from "../../types";
import { prisma } from "../../prismaClient";
import {
  editDeliverable,
  validateCompleteDeliverableInput,
  validateUserPersonTypeAllowed,
  selectDeliverableOrThrow,
} from ".";
import { insertDeliverableAction } from "../deliverableAction/queries";
import { buildRealtimeEmailEnvelope, enqueueRealtimeEmail } from "../../services/emailQueue";

export async function completeDeliverable(
  deliverableId: string,
  finalStatus: FinalDeliverableStatus,
  context: GraphQLContext
): Promise<PrismaDeliverable> {
  validateUserPersonTypeAllowed(context, "completeDeliverable", ["demos-admin", "demos-cms-user"]);
  const completedDeliverable = await prisma().$transaction(async (tx) => {
    const incompleteDeliverable = await selectDeliverableOrThrow({ id: deliverableId }, tx);
    await validateCompleteDeliverableInput(incompleteDeliverable, tx);

    const completedDeliverable = await editDeliverable(
      deliverableId,
      { statusId: finalStatus },
      tx
    );

    const statusToAction: Record<FinalDeliverableStatus, DeliverableActionType> = {
      Accepted: "Accepted Deliverable",
      Approved: "Approved Deliverable",
      "Received and Filed": "Received and Filed Deliverable",
    };

    // Casts below enforced by database
    await insertDeliverableAction(
      {
        deliverableId: deliverableId,
        actionType: statusToAction[finalStatus],
        oldStatus: incompleteDeliverable.statusId as DeliverableStatus,
        newStatus: completedDeliverable.statusId as DeliverableStatus,
        oldDueDate: incompleteDeliverable.dueDate,
        newDueDate: completedDeliverable.dueDate,
        userId: context.user.id,
      },
      tx
    );

    return completedDeliverable;
  });

  try {
    const owner = await prisma().user.findUniqueOrThrow({
      where: { id: completedDeliverable.cmsOwnerUserId },
      select: {
        person: {
          select: {
            email: true,
          },
        },
      },
    });

    const demonstration = await prisma().demonstration.findUniqueOrThrow({
      where: { id: completedDeliverable.demonstrationId },
      select: {
        id: true,
        name: true,
        stateId: true,
      },
    });

    const emailTypeByStatus: Record<FinalDeliverableStatus, "Deliverable Accepted" | "Deliverable Approved" | "Deliverable Received and Filed"> = {
      Accepted: "Deliverable Accepted",
      Approved: "Deliverable Approved",
      "Received and Filed": "Deliverable Received and Filed",
    };

    const envelope = buildRealtimeEmailEnvelope({
      emailType: emailTypeByStatus[finalStatus],
      entityId: completedDeliverable.id,
      to: owner.person.email,
      payload: {
        to: owner.person.email,
        id: completedDeliverable.id,
        name: completedDeliverable.name,
        deliverableType: completedDeliverable.deliverableTypeId,
        dueDate: completedDeliverable.dueDate.toISOString(),
        status: completedDeliverable.statusId,
        demonstration: {
          id: demonstration.id,
          name: demonstration.name,
          state: {
            id: demonstration.stateId,
          },
        },
      },
    });

    await enqueueRealtimeEmail(envelope);
  } catch {
    // Do not fail completion mutation if notification dispatch fails.
  }

  return completedDeliverable;
}
