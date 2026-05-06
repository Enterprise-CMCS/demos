import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { DenyDeliverableExtensionInput, DeliverableStatus } from "../../types";
import { GraphQLContext } from "../../auth";
import {
  getDeliverable,
  validateDenyDeliverableExtensionInput,
  validateUserPersonTypeAllowed,
} from ".";
import { prisma } from "../../prismaClient";
import { insertDeliverableAction } from "../deliverableAction/queries";
import {
  selectDeliverableExtension,
  updateDeliverableExtension,
} from "../deliverableExtension/queries";

export async function denyDeliverableExtension(
  deliverableId: string,
  input: DenyDeliverableExtensionInput,
  context: GraphQLContext
): Promise<PrismaDeliverable> {
  validateUserPersonTypeAllowed(context, "denyDeliverableExtension", [
    "demos-admin",
    "demos-cms-user",
  ]);

  return await prisma().$transaction(async (tx) => {
    const deliverable = await getDeliverable({ id: deliverableId }, tx);
    const deliverableExtension = await selectDeliverableExtension(
      { id: input.deliverableExtensionId },
      true,
      tx
    );

    validateDenyDeliverableExtensionInput(deliverable, deliverableExtension);

    // All casts below enforced by database
    // Make changes in order: insert action, close extension
    // This ensures that action record has the extension ID attached by triggers
    await insertDeliverableAction(
      {
        deliverableId: deliverableId,
        actionType: "Denied Extension Request",
        actionTime: new Date(),
        oldStatus: deliverable.statusId as DeliverableStatus,
        newStatus: deliverable.statusId as DeliverableStatus,
        note: input.details,
        oldDueDate: deliverable.dueDate,
        newDueDate: deliverable.dueDate,
        userId: context.user.id,
      },
      tx
    );
    await updateDeliverableExtension(
      input.deliverableExtensionId,
      {
        statusId: "Denied",
      },
      tx
    );
    return deliverable;
  });
}
