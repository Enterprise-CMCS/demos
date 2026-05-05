import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { GraphQLContext } from "../../auth";
import { DeliverableStatus, FinalDeliverableStatus, DeliverableActionType } from "../../types";
import { prisma } from "../../prismaClient";
import {
  editDeliverable,
  getDeliverable,
  validateCompleteDeliverableInput,
  validateUserPersonTypeAllowed,
} from ".";
import { insertDeliverableAction } from "../deliverableAction/queries";

export async function completeDeliverable(
  deliverableId: string,
  finalStatus: FinalDeliverableStatus,
  context: GraphQLContext
): Promise<PrismaDeliverable> {
  validateUserPersonTypeAllowed(context, "completeDeliverable", ["demos-admin", "demos-cms-user"]);
  return await prisma().$transaction(async (tx) => {
    const incompleteDeliverable = await getDeliverable({ id: deliverableId }, tx);
    validateCompleteDeliverableInput(incompleteDeliverable);

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
        actionTime: new Date(),
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
}
