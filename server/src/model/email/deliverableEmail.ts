import { log } from "../../log";
import { prisma } from "../../prismaClient";
import { buildRealtimeEmailEnvelope, enqueueRealtimeEmail } from "../../services/emailQueue";

export async function dispatchDeliverableSubmittedEmail(input: {
  deliverableId: string;
  triggeredByUserId: string;
}): Promise<void> {
  try {
    const messageId = await enqueueDeliverableSubmittedEmail(input);
    log.info(
      {
        messageId,
        deliverableId: input.deliverableId,
        emailType: "Deliverable Submitted",
      },
      "Deliverable email dispatched"
    );
  } catch (error) {
    log.error(
      {
        error,
        deliverableId: input.deliverableId,
        emailType: "Deliverable Submitted",
      },
      "Failed to dispatch deliverable email"
    );
  }
}

async function enqueueDeliverableSubmittedEmail(input: {
  deliverableId: string;
  triggeredByUserId: string;
}): Promise<string> {
  const deliverable = await prisma().deliverable.findUniqueOrThrow({
    where: { id: input.deliverableId },
    include: {
      cmsOwner: { include: { person: true } },
      demonstration: true,
    },
  });

  const cmsOwnerEmail = deliverable.cmsOwner.person.email.trim();
  if (!cmsOwnerEmail) {
    throw new Error(
      `Cannot dispatch Deliverable Submitted email for deliverable ${input.deliverableId}: ` +
        `CMS owner ${deliverable.cmsOwner.person.id} has no email address.`
    );
  }

  const message = buildRealtimeEmailEnvelope({
    emailType: "Deliverable Submitted",
    entityType: "deliverable",
    entityId: deliverable.id,
    triggeredById: input.triggeredByUserId,
    payload: {
      recipients: {
        to: [
          {
            name: `${deliverable.cmsOwner.person.firstName} ${deliverable.cmsOwner.person.lastName}`.trim(),
            address: cmsOwnerEmail,
          },
        ],
      },
      demonstration: {
        id: deliverable.demonstration.id,
        name: deliverable.demonstration.name,
        stateId: deliverable.demonstration.stateId,
      },
      deliverable: {
        id: deliverable.id,
        name: deliverable.name,
        deliverableTypeId: deliverable.deliverableTypeId,
        dueDate: deliverable.dueDate.toISOString(),
        statusId: deliverable.statusId,
      },
    },
  });

  return enqueueRealtimeEmail(message);
}
