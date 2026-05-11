import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { GraphQLContext } from "../../auth";
import { DeliverableStatus } from "../../types";
import { prisma } from "../../prismaClient";
import {
  editDeliverable,
  getDeliverable,
  validateDeleteDeliverableInput,
  validateUserPersonTypeAllowed,
} from ".";
import { insertDeliverableAction } from "../deliverableAction/queries";

export async function deleteDeliverable(
  deliverableId: string,
  context: GraphQLContext
): Promise<PrismaDeliverable> {
  validateUserPersonTypeAllowed(context, "deleteDeliverable", ["demos-admin", "demos-cms-user"]);

  return await prisma().$transaction(async (tx) => {
    const deliverable = await getDeliverable({ id: deliverableId }, { tx: tx });
    await validateDeleteDeliverableInput(deliverable, tx);

    await editDeliverable(deliverableId, { statusId: "Deleted" }, tx);
    await insertDeliverableAction(
      {
        deliverableId: deliverable.id,
        actionType: "Deleted Deliverable",
        oldStatus: deliverable.statusId as DeliverableStatus,
        newStatus: "Deleted",
        oldDueDate: deliverable.dueDate,
        newDueDate: deliverable.dueDate,
        userId: context.user.id,
      },
      tx
    );
    return deliverable;
  });
}
