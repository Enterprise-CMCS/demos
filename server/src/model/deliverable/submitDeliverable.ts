import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { GraphQLContext } from "../../auth";
import { DeliverableStatus } from "../../types";
import { prisma } from "../../prismaClient";
import { editDeliverable, selectDeliverableOrThrow, validateSubmitDeliverableInput } from ".";
import { insertDeliverableAction } from "../deliverableAction/queries";
import { buildRealtimeEmailEnvelope, enqueueRealtimeEmail } from "../../services/emailQueue";

export async function submitDeliverable(
  deliverableId: string,
  context: GraphQLContext
): Promise<PrismaDeliverable> {
  const submittedDeliverable = await prisma().$transaction(async (tx) => {
    const unsubmittedDeliverable = await selectDeliverableOrThrow({ id: deliverableId }, tx);
    await validateSubmitDeliverableInput(unsubmittedDeliverable, tx);

    const submittedDeliverable = await editDeliverable(
      deliverableId,
      { statusId: "Submitted" },
      tx
    );

    // Casts below enforced by database
    await insertDeliverableAction(
      {
        deliverableId: deliverableId,
        actionType: "Submitted Deliverable",
        oldStatus: unsubmittedDeliverable.statusId as DeliverableStatus,
        newStatus: submittedDeliverable.statusId as DeliverableStatus,
        oldDueDate: unsubmittedDeliverable.dueDate,
        newDueDate: submittedDeliverable.dueDate,
        userId: context.user.id,
      },
      tx
    );

    return submittedDeliverable;
  });

  try {
    const owner = await prisma().user.findUniqueOrThrow({
      where: { id: submittedDeliverable.cmsOwnerUserId },
      select: {
        person: {
          select: {
            email: true,
          },
        },
      },
    });

    const demonstration = await prisma().demonstration.findUniqueOrThrow({
      where: { id: submittedDeliverable.demonstrationId },
      select: {
        id: true,
        name: true,
        stateId: true,
      },
    });

    const envelope = buildRealtimeEmailEnvelope({
      emailType: "Deliverable Submitted",
      entityId: submittedDeliverable.id,
      to: owner.person.email,
      payload: {
        to: owner.person.email,
        id: submittedDeliverable.id,
        name: submittedDeliverable.name,
        deliverableType: submittedDeliverable.deliverableTypeId,
        dueDate: submittedDeliverable.dueDate.toISOString(),
        status: submittedDeliverable.statusId,
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
    // Do not fail submit mutation if notification dispatch fails.
  }

  return submittedDeliverable;
}
