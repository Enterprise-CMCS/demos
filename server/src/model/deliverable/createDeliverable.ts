import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { CreateDeliverableInput } from "../../types";
import { GraphQLContext } from "../../auth/auth.util";
import {
  parseCreateDeliverableInput,
  validateCreateDeliverableInput,
  insertDeliverable,
  validateUserPersonTypeAllowed,
} from ".";
import { prisma } from "../../prismaClient";
import { insertDeliverableAction } from "../deliverableAction/queries";
import { setDeliverableDemonstrationTypes } from "../deliverableDemonstrationType";

export async function createDeliverable(
  input: CreateDeliverableInput,
  context: GraphQLContext
): Promise<PrismaDeliverable> {
  const currentUserId = context.user.id;
  validateUserPersonTypeAllowed(context, "createDeliverable", ["demos-admin", "demos-cms-user"]);
  const parsedInput = parseCreateDeliverableInput(input);
  const createdDeliverable = await prisma().$transaction(async (tx) => {
    const actionTime = new Date();
    await validateCreateDeliverableInput(parsedInput, tx);

    const newDeliverable = await insertDeliverable(parsedInput, tx);
    const newDemonstrationTypes = parsedInput.demonstrationTypes ?? new Set();

    await setDeliverableDemonstrationTypes(
      {
        deliverableId: newDeliverable.id,
        demonstrationId: parsedInput.demonstrationId,
        demonstrationTypes: Array.from(newDemonstrationTypes),
      },
      tx
    );

    await insertDeliverableAction(
      {
        deliverableId: newDeliverable.id,
        actionType: "Created Deliverable Slot",
        actionTime: actionTime,
        oldStatus: "Upcoming",
        newStatus: "Upcoming",
        oldDueDate: parsedInput.dueDate.easternTZDate,
        newDueDate: parsedInput.dueDate.easternTZDate,
        userId: currentUserId,
      },
      tx
    );

    return newDeliverable;
  });
  return createdDeliverable;
}
