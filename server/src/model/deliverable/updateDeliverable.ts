import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { DeliverableStatus, UpdateDeliverableInput } from "../../types";
import { GraphQLContext } from "../../auth/auth.util";
import {
  parseUpdateDeliverableInput,
  validateUpdateDeliverableInput,
  prismaUpdateDeliverable,
  getDeliverable,
} from ".";
import { prisma } from "../../prismaClient";
import { insertDeliverableAction } from "../deliverableAction";
import {
  getDeliverableDemonstrationTypes,
  setDeliverableDemonstrationTypes,
} from "../deliverableDemonstrationType";
import { findListDifferences } from "../../validationUtilities";

export async function updateDeliverable(
  deliverableId: string,
  input: UpdateDeliverableInput,
  context: GraphQLContext
): Promise<PrismaDeliverable> {
  const currentUserId = context.user.id;
  const parsedInput = parseUpdateDeliverableInput(input);
  const updatedDeliverable = await prisma().$transaction(async (tx) => {
    const actionTime = new Date();
    await validateUpdateDeliverableInput(deliverableId, parsedInput, tx);

    // Pull old and new values for logic purposes
    const oldDeliverable = await getDeliverable({ id: deliverableId }, tx);

    // Now, run the update
    const updatedDeliverable = await prismaUpdateDeliverable(deliverableId, parsedInput, tx);

    // Conditionally handle if demonstration type changes are requested
    if (parsedInput.demonstrationTypes) {
      const oldDemonstrationTypes = (
        await getDeliverableDemonstrationTypes(oldDeliverable.id, tx)
      ).map((demonstrationType) => demonstrationType.demonstrationTypeTagNameId);

      // We've already confirmed that the new list is unique in validation
      // We know the old list is unique because of the database
      // So we can just use the elements comparison here
      const diff = findListDifferences(oldDemonstrationTypes, parsedInput.demonstrationTypes);
      if (!diff.listsElementsSame) {
        await setDeliverableDemonstrationTypes(
          {
            deliverableId: updatedDeliverable.id,
            demonstrationId: updatedDeliverable.demonstrationId,
            demonstrationTypes: parsedInput.demonstrationTypes,
          },
          tx
        );
      }
    }

    // Conditionally log changes to the due date here
    // All as statements below are enforced by the DB
    if (parsedInput.dueDate) {
      await insertDeliverableAction(
        {
          deliverableId: updatedDeliverable.id,
          actionType: "Manually Changed Due Date",
          actionTime: actionTime,
          oldStatus: oldDeliverable.statusId as DeliverableStatus,
          newStatus: updatedDeliverable.statusId as DeliverableStatus,
          oldDueDate: oldDeliverable.dueDate,
          newDueDate: updatedDeliverable.dueDate,
          userId: currentUserId,
        },
        tx
      );
    }

    return updatedDeliverable;
  });
  return updatedDeliverable;
}
