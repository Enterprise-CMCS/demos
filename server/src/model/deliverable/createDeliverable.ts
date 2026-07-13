import { Deliverable as PrismaDeliverable, Prisma } from "@prisma/client";
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

type CurrentUserWithPerson = Prisma.UserGetPayload<{ include: { person: true } }>;

async function getCurrentUser(context: GraphQLContext): Promise<CurrentUserWithPerson> {
  return prisma().user.findUniqueOrThrow({
    where: { id: context.user.id },
    include: { person: true },
  });
}

export async function createDeliverable(
  input: CreateDeliverableInput,
  context: GraphQLContext
): Promise<PrismaDeliverable> {
  const currentUserId = context.user.id;
  validateUserPersonTypeAllowed(context, "createDeliverable", ["demos-admin", "demos-cms-user"]);
  const currentUser = await getCurrentUser(context);
  const currentUserEmail = currentUser.person.email.trim();
  if (!currentUserEmail) {
    throw new Error(
      "Cannot enqueue Deliverable Created email because the current user email is missing."
    );
  }

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

  const message = buildRealtimeEmailEnvelope({
    emailType: "Deliverable Created",
    entityId: createdDeliverable.id,
    to: currentUserEmail,
    payload: {
      to: currentUserEmail,
      id: createdDeliverable.id,
      name: parsedInput.name,
      deliverableType: parsedInput.deliverableType,
      dueDate: parsedInput.dueDate.easternTZDate.toISOString(),
      status: "Upcoming",
    },
  });

  await enqueueRealtimeEmail(message);

  return createdDeliverable;
}
