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
import { dispatchDeliverableCompletedEmail } from "../email";

type CompleteDeliverableOptions = {
  sendEmailNotifications?: boolean;
};

export async function completeDeliverable(
  deliverableId: string,
  finalStatus: FinalDeliverableStatus,
  context: GraphQLContext,
  options: CompleteDeliverableOptions = {}
): Promise<PrismaDeliverable> {
  validateUserPersonTypeAllowed(context, "completeDeliverable", ["demos-admin", "demos-cms-user"]);
  const { completedDeliverable, sourceActionId } = await prisma().$transaction(async (tx) => {
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
    const action = await insertDeliverableAction(
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

    return {
      completedDeliverable,
      sourceActionId: action.id,
    };
  });

  if (options.sendEmailNotifications !== false) {
    await dispatchDeliverableCompletedEmail({
      deliverableId,
      finalStatus,
      sourceActionId,
      triggeredByUserId: context.user.id,
    });
  }

  return completedDeliverable;
}
