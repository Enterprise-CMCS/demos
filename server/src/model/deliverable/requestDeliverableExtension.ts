import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { DeliverableStatus, RequestDeliverableExtensionInput } from "../../types";
import { GraphQLContext } from "../../auth";
import {
  selectDeliverableOrThrow,
  parseRequestDeliverableExtensionInput,
  validateRequestDeliverableExtensionInput,
} from ".";
import { prisma } from "../../prismaClient";
import { insertDeliverableAction } from "../deliverableAction/queries";
import { insertDeliverableExtension } from "../deliverableExtension/queries";

import { notifyDeliverableExtensionRequested } from "../email/notifyDeliverableEvent";

export async function requestDeliverableExtension(
  deliverableId: string,
  input: RequestDeliverableExtensionInput,
  context: GraphQLContext
): Promise<PrismaDeliverable> {
  const parsedInput = parseRequestDeliverableExtensionInput(input);

  const { deliverable, sourceActionId } = await prisma().$transaction(async (tx) => {
    const deliverable = await selectDeliverableOrThrow({ id: deliverableId }, tx);
    await validateRequestDeliverableExtensionInput(deliverable, parsedInput, tx);

    // Add the extension before the action record; this ensures triggers capture the information
    await insertDeliverableExtension(
      {
        deliverableId: deliverableId,
        reasonCode: parsedInput.reason,
        requestedDate: parsedInput.requestedDueDate.easternTZDate,
      },
      tx
    );

    // Casts below enforced by database
    const action = await insertDeliverableAction(
      {
        deliverableId: deliverableId,
        actionType: "Requested Extension",
        oldStatus: deliverable.statusId as DeliverableStatus,
        newStatus: deliverable.statusId as DeliverableStatus,
        note: input.details,
        oldDueDate: deliverable.dueDate,
        newDueDate: deliverable.dueDate,
        userId: context.user.id,
      },
      tx
    );
    return { deliverable, sourceActionId: action.id };
  });
  await notifyDeliverableExtensionRequested({
    deliverableId,
    sourceActionId,
    requestedDueDate: parsedInput.requestedDueDate.easternTZDate,
    triggeredByUserId: context.user.id,
  });
  return deliverable;
}
