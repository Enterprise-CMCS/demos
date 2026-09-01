import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { GraphQLContext } from "../../auth";
import { DeliverableStatus } from "../../types";
import { prisma } from "../../prismaClient";
import { editDeliverable, selectDeliverableOrThrow, validateSubmitDeliverableInput } from ".";
import { insertDeliverableAction } from "../deliverableAction/queries";
import { dispatchDeliverableSubmittedEmail } from "../email";

export async function submitDeliverable(
  deliverableId: string,
  context: GraphQLContext,
  options: { sendEmailNotifications?: boolean } = {}
): Promise<PrismaDeliverable> {
  const { submittedDeliverable, sourceActionId } = await prisma().$transaction(async (tx) => {
    const unsubmittedDeliverable = await selectDeliverableOrThrow({ id: deliverableId }, tx);
    await validateSubmitDeliverableInput(unsubmittedDeliverable, tx);

    const submittedDeliverable = await editDeliverable(
      deliverableId,
      { statusId: "Submitted" },
      tx
    );

    // Casts below enforced by database
    const action = await insertDeliverableAction(
      {
        deliverableId: deliverableId,
        actionType: "Submitted Deliverable",
        oldStatus: unsubmittedDeliverable.statusId as DeliverableStatus,
        newStatus: submittedDeliverable.statusId as DeliverableStatus,
        oldDueDate: unsubmittedDeliverable.dueDate,
        newDueDate: submittedDeliverable.dueDate,
        userId: context.user.id,
      },
      tx
    );

    return {
      submittedDeliverable,
      sourceActionId: action.id,
    };
  });

  if (options.sendEmailNotifications !== false) {
    await dispatchDeliverableSubmittedEmail({
      deliverableId: submittedDeliverable.id,
      sourceActionId,
      triggeredByUserId: context.user.id,
    });
  }

  return submittedDeliverable;
}
