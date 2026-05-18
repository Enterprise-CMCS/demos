import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { DeliverableStatus, RequestDeliverableExtensionInput } from "../../types";
import { GraphQLContext } from "../../auth";
import {
  selectDeliverable,
  parseRequestDeliverableExtensionInput,
  validateRequestDeliverableExtensionInput,
  validateUserPersonTypeAllowed,
} from ".";
import { prisma } from "../../prismaClient";
import { insertDeliverableAction } from "../deliverableAction/queries";
import { insertDeliverableExtension } from "../deliverableExtension/queries";

export async function requestDeliverableExtension(
  deliverableId: string,
  input: RequestDeliverableExtensionInput,
  context: GraphQLContext
): Promise<PrismaDeliverable> {
  validateUserPersonTypeAllowed(context, "requestDeliverableExtension", [
    "demos-admin",
    "demos-state-user",
  ]);
  const parsedInput = parseRequestDeliverableExtensionInput(input);

  return await prisma().$transaction(async (tx) => {
    const deliverable = await selectDeliverable({ id: deliverableId }, tx);
    if (!deliverable) {
      throw new Error(`Deliverable with ID ${deliverableId} not found`);
    }
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
    await insertDeliverableAction(
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
    return deliverable;
  });
}
