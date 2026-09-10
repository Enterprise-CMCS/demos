import { STATE_USER_DEMONSTRATION_ROLES } from "../../constants";
import { log } from "../../log";
import { prisma } from "../../prismaClient";
import { RealtimeEmailType } from "../../services/emailQueue";
import { FinalDeliverableStatus } from "../../types";
import { enqueueTrackedRealtimeEmail } from "./emailNotification";

type DeliverableEmailInput = {
  deliverableId: string;
  sourceActionId: string;
  triggeredByUserId: string;
};

type Recipient = {
  personId: string;
  name: string;
  address: string;
};

export async function notifyDeliverableSubmitted(
  input: DeliverableEmailInput
): Promise<void> {
  return notifyDeliverableStatusChanged(input, "Deliverable Submitted", "cmsOwner");
}

export async function notifyDeliverableCompleted(
  input: DeliverableEmailInput & { finalStatus: FinalDeliverableStatus }
): Promise<void> {
  const emailTypeByStatus: Record<FinalDeliverableStatus, RealtimeEmailType> = {
    Accepted: "Deliverable Accepted",
    Approved: "Deliverable Approved",
    "Received and Filed": "Deliverable Received and Filed",
  };

  return notifyDeliverableStatusChanged(input, emailTypeByStatus[input.finalStatus], "state");
}

export async function notifyDeliverableResubmissionRequested(
  input: DeliverableEmailInput & { previousDueDate: Date }
): Promise<void> {
  return notifyDeliverableStatusChanged(input, "Resubmission Requested", "state", {
    previousDueDate: input.previousDueDate.toISOString(),
  });
}

export async function notifyDeliverableExtensionDecisionMade(
  input: DeliverableEmailInput & {
    extensionDecision: "Approved" | "Denied";
    previousDueDate: Date;
  }
): Promise<void> {
  return notifyDeliverableStatusChanged(input, "Extension Decision Made", "state", {
    extensionDecision: input.extensionDecision,
    previousDueDate: input.previousDueDate.toISOString(),
  });
}

async function notifyDeliverableStatusChanged(
  input: DeliverableEmailInput,
  emailType: RealtimeEmailType,
  audience: "cmsOwner" | "state",
  extraDeliverablePayload: Record<string, string> = {}
): Promise<void> {
  try {
    const deliverable = await prisma().deliverable.findUniqueOrThrow({
      where: { id: input.deliverableId },
      include: {
        cmsOwner: { include: { person: true } },
        demonstration: {
          include: {
            demonstrationRoleAssignments: {
              where: {
                roleId: { in: Array.from(STATE_USER_DEMONSTRATION_ROLES) },
              },
              include: { person: true },
            },
          },
        },
      },
    });
    const recipients = deduplicateRecipients(
      audience === "cmsOwner"
        ? [deliverable.cmsOwner.person]
        : deliverable.demonstration.demonstrationRoleAssignments.map(
            (assignment) => assignment.person
          ),
      input.deliverableId,
      emailType
    );

    if (recipients.length === 0) {
      throw new Error(
        `Cannot queue ${emailType} email for deliverable ${input.deliverableId}: ` +
          "no State Points of Contact were found on the demonstration."
      );
    }

    const messageId = await enqueueTrackedRealtimeEmail(
      {
        emailType,
        entityType: "deliverable",
        entityId: deliverable.id,
        triggeredBy: {
          type: "realtime",
          id: input.triggeredByUserId,
        },
        payload: {
          recipients: {
            to: [],
            bcc: recipients.map(({ name, address }) => ({ name, address })),
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
            ...extraDeliverablePayload,
          },
        },
      },
      { deliverableActionId: input.sourceActionId },
      recipients.map(({ personId }) => ({ personId }))
    );

    log.info(
      {
        messageId,
        deliverableId: deliverable.id,
        emailType,
      },
      "Deliverable email queued"
    );
  } catch (error) {
    log.error(
      {
        error,
        deliverableId: input.deliverableId,
        emailType,
      },
      "Failed to queue deliverable email"
    );
  }
}

function deduplicateRecipients(
  people: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>,
  deliverableId: string,
  emailType: RealtimeEmailType
): Recipient[] {
  const recipients = new Map<string, Recipient>();

  for (const person of people) {
    const address = person.email.trim().toLowerCase();
    if (!address) {
      throw new Error(
        `Cannot queue ${emailType} email for deliverable ${deliverableId}: ` +
          `person ${person.id} has no email address.`
      );
    }

    if (!recipients.has(address)) {
      recipients.set(address, {
        personId: person.id,
        name: `${person.firstName} ${person.lastName}`.trim(),
        address,
      });
    }
  }

  return Array.from(recipients.values());
}
