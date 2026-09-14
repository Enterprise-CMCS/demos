import { z } from "zod";

import { CMS_USER_DEMONSTRATION_ROLES, STATE_USER_DEMONSTRATION_ROLES } from "../../constants";
import { log } from "../../log";
import { prisma } from "../../prismaClient";
import { RealtimeEmailType } from "../../services/emailQueue";
import { FinalDeliverableStatus } from "../../types";
import { enqueueAndTrackRealtimeEmail } from "./emailNotification";

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

const emailSchema = z.email();

export async function notifyDeliverableSubmitted(
  input: DeliverableEmailInput
): Promise<void> {
  return notifyDeliverableStatusChanged(input, "Deliverable Submitted", "cms");
}

export async function notifyDeliverableCompleted(
  input: DeliverableEmailInput & { finalStatus: FinalDeliverableStatus }
): Promise<void> {
  const emailTypeByStatus: Record<FinalDeliverableStatus, RealtimeEmailType> = {
    Accepted: "Deliverable Accepted",
    Approved: "Deliverable Approved",
    "Received and Filed": "Deliverable Received and Filed"
  };

  return notifyDeliverableStatusChanged(input, emailTypeByStatus[input.finalStatus], "state");
}

export async function notifyDeliverableResubmissionRequested(
  input: DeliverableEmailInput & { previousDueDate: Date }
): Promise<void> {
  return notifyDeliverableStatusChanged(input, "Resubmission Requested", "state", {
    previousDueDate: input.previousDueDate.toISOString()
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
    previousDueDate: input.previousDueDate.toISOString()
  });
}

export async function notifyDeliverableDueDateUpdated(
  input: DeliverableEmailInput & { previousDueDate: Date }
): Promise<void> {
  return notifyDeliverableStatusChanged(input, "Deliverable Due Date Updated", "state", {
    previousDueDate: input.previousDueDate.toISOString()
  });
}

export async function notifyDeliverableExtensionRequested(
  input: DeliverableEmailInput & { requestedDueDate: Date }
): Promise<void> {
  return notifyDeliverableStatusChanged(input, "Extension Requested", "cms", {
    requestedDueDate: input.requestedDueDate.toISOString()
  });
}

export async function notifyPublicCommentAdded(input: {
  deliverableId: string;
  publicCommentId: string;
  triggeredByUserId: string;
}): Promise<void> {
  return notifyDeliverableStatusChanged(input, "Deliverable Comment", "all");
}

async function notifyDeliverableStatusChanged(
  input:
    | DeliverableEmailInput
    | {
        deliverableId: string;
        publicCommentId: string;
        triggeredByUserId: string;
      },
  emailType: RealtimeEmailType,
  audience: "cms" | "state" | "all",
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
              ...(audience === "all" ? {} : {
                where: {
                  roleId: { in: Array.from(audience === "state"
                    ? STATE_USER_DEMONSTRATION_ROLES
                    : CMS_USER_DEMONSTRATION_ROLES) }
                },
              }),
              include: { person: true }
            }
          }
        }
      }
    });
    if (
      emailType === "Deliverable Comment" &&
      !["Accepted", "Approved", "Received and Filed"].includes(deliverable.statusId)
    ) {
      return;
    }
    const recipients = deduplicateRecipients(
      [
        ...(audience !== "state" ? [deliverable.cmsOwner.person] : []),
        ...deliverable.demonstration.demonstrationRoleAssignments.map(
          (assignment) => assignment.person
        )
      ],
      input.deliverableId,
      emailType
    );

    if (recipients.length === 0) {
      throw new Error(
        `Cannot queue ${emailType} email for deliverable ${input.deliverableId}: ` +
          "no State Points of Contact were found on the demonstration."
      );
    }

    const messageId = await enqueueAndTrackRealtimeEmail(
      {
        emailType,
        entityType: "deliverable",
        entityId: deliverable.id,
        triggeredBy: {
          type: "realtime",
          id: input.triggeredByUserId
        },
        payload: {
          recipients: {
            to: [],
            bcc: recipients.map(({ name, address }) => ({ name, address }))
          },
          demonstration: {
            id: deliverable.demonstration.id,
            name: deliverable.demonstration.name,
            stateId: deliverable.demonstration.stateId
          },
          deliverable: {
            id: deliverable.id,
            name: deliverable.name,
            deliverableTypeId: deliverable.deliverableTypeId,
            dueDate: deliverable.dueDate.toISOString(),
            statusId: deliverable.statusId,
            ...extraDeliverablePayload
          }
        }
      },
      "publicCommentId" in input
        ? { publicCommentId: input.publicCommentId }
        : { deliverableActionId: input.sourceActionId },
      recipients.map(({ personId }) => ({ personId }))
    );

    if (messageId === null) {
      return;
    }

    log.info(
      {
        messageId,
        deliverableId: deliverable.id,
        emailType
      },
      "Deliverable email queued"
    );
  } catch (error) {
    log.error(
      {
        error,
        deliverableId: input.deliverableId,
        emailType
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
    if (!isAnEmail(address)) {
      throw new Error(
        `Cannot queue ${emailType} email for deliverable ${deliverableId}: ` +
          `person ${person.id} does not have a valid email address.`
      );
    }

    if (!recipients.has(address)) {
      recipients.set(address, {
        personId: person.id,
        name: `${person.firstName} ${person.lastName}`.trim(),
        address
      });
    }
  }

  return Array.from(recipients.values());
}

function isAnEmail(address: string): boolean {
  return emailSchema.safeParse(address).success;
}
