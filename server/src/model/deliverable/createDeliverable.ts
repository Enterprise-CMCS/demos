import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { CreateDeliverableInput } from "../../types";
import { GraphQLContext } from "../../auth";
import {
  parseCreateDeliverableInput,
  validateCreateDeliverableInput,
  insertDeliverable,
  validateUserPersonTypeAllowed,
} from ".";
import { prisma } from "../../prismaClient";
import { insertDeliverableAction } from "../deliverableAction/queries";
import { setDeliverableDemonstrationTypes } from "../deliverableDemonstrationType";
import { dispatchDeliverableCreatedEmail } from "../email";

export async function createDeliverable(
  input: CreateDeliverableInput,
  context: GraphQLContext,
  options: { sendEmailNotifications?: boolean } = {}
): Promise<PrismaDeliverable> {
  const currentUserId = context.user.id;
  validateUserPersonTypeAllowed(context, "createDeliverable", ["demos-admin", "demos-cms-user"]);

  const parsedInput = parseCreateDeliverableInput(input);
  const { newDeliverable, sourceActionId } = await prisma().$transaction(async (tx) => {
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

    const action = await insertDeliverableAction(
      {
        deliverableId: newDeliverable.id,
        actionType: "Created Deliverable Slot",
        oldStatus: "Upcoming",
        newStatus: "Upcoming",
        oldDueDate: parsedInput.dueDate.easternTZDate,
        newDueDate: parsedInput.dueDate.easternTZDate,
        userId: currentUserId,
      },
      tx
    );

    return {
      newDeliverable,
      sourceActionId: action.id,
    };
  });

  if (options.sendEmailNotifications !== false) {
    await dispatchDeliverableCreatedEmail({
      deliverableId: newDeliverable.id,
      sourceActionId,
      triggeredByUserId: currentUserId,
    });
  }

  return newDeliverable;
}
