import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { DenyDeliverableExtensionInput, DeliverableStatus } from "../../types";
import { GraphQLContext } from "../../auth";
import {
  selectDeliverableOrThrow,
  validateDenyDeliverableExtensionInput,
  validateUserPersonTypeAllowed,
} from ".";
import { prisma } from "../../prismaClient";
import { insertDeliverableAction } from "../deliverableAction/queries";
import {
  selectDeliverableExtension,
  updateDeliverableExtension,
} from "../deliverableExtension/queries";
import { dispatchExtensionDecisionMadeEmail } from "../email";

export async function denyDeliverableExtension(
  deliverableId: string,
  input: DenyDeliverableExtensionInput,
  context: GraphQLContext,
  options: { sendEmailNotifications?: boolean } = {}
): Promise<PrismaDeliverable> {
  validateUserPersonTypeAllowed(context, "denyDeliverableExtension", [
    "demos-admin",
    "demos-cms-user",
  ]);

  const { deliverable, sourceActionId } = await prisma().$transaction(async (tx) => {
    const deliverable = await selectDeliverableOrThrow({ id: deliverableId }, tx);
    const deliverableExtension = await selectDeliverableExtension(
      { id: input.deliverableExtensionId },
      true,
      tx
    );

    validateDenyDeliverableExtensionInput(deliverable, deliverableExtension);

    // All casts below enforced by database
    // Make changes in order: insert action, close extension
    // This ensures that action record has the extension ID attached by triggers
    const action = await insertDeliverableAction(
      {
        deliverableId: deliverableId,
        actionType: "Denied Extension Request",
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
    return { deliverable, sourceActionId: action.id };
  });

  if (options.sendEmailNotifications !== false) {
    await dispatchExtensionDecisionMadeEmail({
      deliverableId,
      extensionDecision: "Denied",
      previousDueDate: deliverable.dueDate,
      sourceActionId,
      triggeredByUserId: context.user.id,
    });
  }

  return deliverable;
}
