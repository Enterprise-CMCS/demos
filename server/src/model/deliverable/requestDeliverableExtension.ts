import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { DeliverableStatus, RequestDeliverableExtensionInput } from "../../types";
import { GraphQLContext } from "../../auth";
import {
  getDeliverable,
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
  validateUserPersonTypeAllowed(context, "requestDeliverableExtension", ["demos-state-user"]);
  const parsedInput = parseRequestDeliverableExtensionInput(input);

  return await prisma().$transaction(async (tx) => {
    const deliverable = await getDeliverable({ id: deliverableId }, tx);
    await validateRequestDeliverableExtensionInput(deliverable, parsedInput, tx);

    // Add the extension before the action record; this ensures triggers capture the information
    await insertDeliverableExtension(
      {
        deliverableId: deliverableId,
        reasonCode: parsedInput.reason,
        requestedDate: parsedInput.newDueDate.easternTZDate,
      },
      tx
    );

    // Casts below enforced by database
    await insertDeliverableAction(
      {
        deliverableId: deliverableId,
        actionType: "Requested Extension",
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
    return deliverable;
  });
}
