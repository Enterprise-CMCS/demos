import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { CreateDeliverableInput } from "../../types";
import { getCurrentUserId, GraphQLContext } from "../../auth/auth.util";
import { parseCreateDeliverableInput, validateCreateDeliverableInput } from ".";
import { prisma } from "../../prismaClient";
import { insertDeliverable } from "./queries/insertDeliverable";
import { insertDeliverableAction } from "../deliverableAction";
import { setDeliverableDemonstrationTypes } from "../deliverableDemonstrationType";

export async function createDeliverable(
  input: CreateDeliverableInput,
  context: GraphQLContext
): Promise<PrismaDeliverable> {
  const currentUserId = getCurrentUserId(context);
  const parsedInput = parseCreateDeliverableInput(input);
  const createdDeliverable = await prisma().$transaction(async (tx) => {
    const actionTime = new Date();
    await validateCreateDeliverableInput(parsedInput, tx);

    const newDeliverable = await insertDeliverable(parsedInput, tx);

    await setDeliverableDemonstrationTypes(
      {
        deliverableId: newDeliverable.id,
        demonstrationId: parsedInput.demonstrationId,
        demonstrationTypes: parsedInput.demonstrationTypes ?? [],
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
