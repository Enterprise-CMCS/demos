import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { GraphQLContext } from "../../auth";
import { DeliverableStatus } from "../../types";
import { prisma } from "../../prismaClient";
import {
  editDeliverable,
  getDeliverable,
  validateStartDeliverableReviewInput,
  validateUserPersonTypeAllowed,
} from ".";
import { insertDeliverableAction } from "../deliverableAction/queries";

export async function startDeliverableReview(
  deliverableId: string,
  context: GraphQLContext
): Promise<PrismaDeliverable> {
  validateUserPersonTypeAllowed(context, "startDeliverableReview", [
    "demos-admin",
    "demos-cms-user",
  ]);
  return await prisma().$transaction(async (tx) => {
    const unstartedDeliverable = await getDeliverable({ id: deliverableId }, tx);
    validateStartDeliverableReviewInput(unstartedDeliverable);

    const startedDeliverable = await editDeliverable(
      deliverableId,
      { statusId: "Under CMS Review" },
      tx
    );

    // Casts below enforced by database
    await insertDeliverableAction(
      {
        deliverableId: deliverableId,
        actionType: "Started Review",
        actionTime: new Date(),
        oldStatus: unstartedDeliverable.statusId as DeliverableStatus,
        newStatus: startedDeliverable.statusId as DeliverableStatus,
        oldDueDate: unstartedDeliverable.dueDate,
        newDueDate: startedDeliverable.dueDate,
        userId: context.user.id,
      },
      tx
    );

    return startedDeliverable;
  });
}
