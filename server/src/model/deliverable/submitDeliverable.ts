import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { GraphQLContext } from "../../auth";
import { DeliverableStatus } from "../../types";
import { prisma } from "../../prismaClient";
import { editDeliverable, getDeliverable, validateSubmitDeliverableInput } from ".";
import { insertDeliverableAction } from "../deliverableAction/queries";

export async function submitDeliverable(
  deliverableId: string,
  context: GraphQLContext
): Promise<PrismaDeliverable> {
  return await prisma().$transaction(async (tx) => {
    const unsubmittedDeliverable = await getDeliverable({ id: deliverableId }, tx);
    await validateSubmitDeliverableInput(unsubmittedDeliverable, tx);

    const submittedDeliverable = await editDeliverable(
      deliverableId,
      { statusId: "Submitted" },
      tx
    );

    // Casts below enforced by database
    await insertDeliverableAction(
      {
        deliverableId: deliverableId,
        actionType: "Submitted Deliverable",
        actionTime: new Date(),
        oldStatus: unsubmittedDeliverable.statusId as DeliverableStatus,
        newStatus: submittedDeliverable.statusId as DeliverableStatus,
        oldDueDate: unsubmittedDeliverable.dueDate,
        newDueDate: submittedDeliverable.dueDate,
        userId: context.user.id,
      },
      tx
    );

    return submittedDeliverable;
  });
}
