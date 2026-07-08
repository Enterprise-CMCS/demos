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
import { buildRealtimeEmailEnvelope, enqueueRealtimeEmail } from "../../services/emailQueue";

export async function createDeliverable(
  input: CreateDeliverableInput,
  context: GraphQLContext
): Promise<PrismaDeliverable> {
  const currentUserId = context.user.id;
  validateUserPersonTypeAllowed(context, "createDeliverable", ["demos-admin", "demos-cms-user"]);
  const parsedInput = parseCreateDeliverableInput(input);
  const createdDeliverable = await prisma().$transaction(async (tx) => {
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

  try {
    const owner = await prisma().user.findUniqueOrThrow({
      where: { id: createdDeliverable.cmsOwnerUserId },
      select: {
        person: {
          select: {
            email: true,
          },
        },
      },
    });

    const demonstration = await prisma().demonstration.findUniqueOrThrow({
      where: { id: createdDeliverable.demonstrationId },
      select: {
        id: true,
        name: true,
        stateId: true,
      },
    });

    const envelope = buildRealtimeEmailEnvelope({
      emailType: "Deliverable Created",
      entityId: createdDeliverable.id,
      to: owner.person.email,
      payload: {
        to: owner.person.email,
        id: createdDeliverable.id,
        name: createdDeliverable.name,
        deliverableType: createdDeliverable.deliverableTypeId,
        dueDate: createdDeliverable.dueDate.toISOString(),
        status: createdDeliverable.statusId,
        demonstration: {
          id: demonstration.id,
          name: demonstration.name,
          state: {
            id: demonstration.stateId,
          },
        },
      },
    });

    await enqueueRealtimeEmail(envelope);
  } catch {
    // Do not fail deliverable mutation if notification dispatch fails.
  }

  return createdDeliverable;
}
