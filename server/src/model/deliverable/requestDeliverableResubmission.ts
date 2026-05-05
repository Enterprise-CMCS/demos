import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { DeliverableStatus, RequestDeliverableResubmissionInput } from "../../types";
import { GraphQLContext } from "../../auth";
import {
  editDeliverable,
  getDeliverable,
  parseRequestDeliverableResubmissionInput,
  validateRequestDeliverableResubmissionInput,
  validateUserPersonTypeAllowed,
} from ".";
import { prisma } from "../../prismaClient";
import { insertDeliverableAction } from "../deliverableAction/queries";

export async function requestDeliverableResubmission(
  deliverableId: string,
  input: RequestDeliverableResubmissionInput,
  context: GraphQLContext
): Promise<PrismaDeliverable> {
  validateUserPersonTypeAllowed(context, "requestDeliverableResubmission", [
    "demos-admin",
    "demos-cms-user",
  ]);
  const parsedInput = parseRequestDeliverableResubmissionInput(input);

  return await prisma().$transaction(async (tx) => {
    const unrequestedDeliverable = await getDeliverable({ id: deliverableId }, tx);
    validateRequestDeliverableResubmissionInput(unrequestedDeliverable, parsedInput);

    const requestedDeliverable = await editDeliverable(
      deliverableId,
      {
        statusId: "Upcoming",
        dueDate: parsedInput.newDueDate.easternTZDate,
      },
      tx
    );

    // Casts below enforced by database
    await insertDeliverableAction(
      {
        deliverableId: deliverableId,
        actionType: "Requested Resubmission",
        actionTime: new Date(),
        oldStatus: unrequestedDeliverable.statusId as DeliverableStatus,
        newStatus: requestedDeliverable.statusId as DeliverableStatus,
        note: input.details,
        oldDueDate: unrequestedDeliverable.dueDate,
        newDueDate: requestedDeliverable.dueDate,
        userId: context.user.id,
      },
      tx
    );

    return requestedDeliverable;
  });
}
