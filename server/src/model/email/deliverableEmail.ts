import { log } from "../../log";
import { prisma } from "../../prismaClient";
import { buildRealtimeEmailEnvelope } from "../../services/emailQueue";
import {
  ADMIN_DEMONSTRATION_ROLES,
  CMS_USER_DEMONSTRATION_ROLES,
  STATE_USER_DEMONSTRATION_ROLES,
} from "../../constants";
import { enqueueTrackedRealtimeEmail } from "./emailNotification";
import { FinalDeliverableStatus } from "../../types";

type DeliverableEmailContextInput = {
  deliverableId: string;
  triggeredByUserId: string;
};

type DeliverableEmailDispatchInput = DeliverableEmailContextInput & {
  sourceActionId: string;
};

type MultipleDeliverablesCreatedEmailDispatchInput = {
  deliverableIds: string[];
  triggeredByUserId: string;
};

type DeliverablePreviousDueDateEmailDispatchInput = DeliverableEmailDispatchInput & {
  previousDueDate: Date;
};

type ExtensionRequestedEmailDispatchInput = DeliverableEmailDispatchInput & {
  requestedDueDate: Date;
};

type ExtensionDecisionMadeEmailDispatchInput = DeliverablePreviousDueDateEmailDispatchInput & {
  extensionDecision: "Approved" | "Denied";
};

type DeliverableCompletedEmailDispatchInput = DeliverableEmailDispatchInput & {
  finalStatus: FinalDeliverableStatus;
};

type PublicCommentAddedEmailDispatchInput = DeliverableEmailContextInput & {
  publicCommentId: string;
};

type ResolvedEmailRecipient = {
  personId: string;
  name: string;
  address: string;
};

export async function dispatchDeliverableCreatedEmail(
  input: DeliverableEmailDispatchInput
): Promise<void> {
  return dispatchDeliverableEmail(input, "Deliverable Created", enqueueDeliverableCreatedEmail);
}

export async function dispatchMultipleDeliverablesCreatedEmail(
  input: MultipleDeliverablesCreatedEmailDispatchInput
): Promise<void> {
  try {
    const messageId = await enqueueMultipleDeliverablesCreatedEmail(input);
    log.info(
      {
        messageId,
        deliverableIds: input.deliverableIds,
        emailType: "Multiple Deliverables Created",
      },
      "Deliverable email dispatched"
    );
  } catch (error) {
    log.error(
      {
        error,
        deliverableIds: input.deliverableIds,
        emailType: "Multiple Deliverables Created",
      },
      "Failed to dispatch deliverable email"
    );
  }
}

export async function dispatchDeliverableSubmittedEmail(
  input: DeliverableEmailDispatchInput
): Promise<void> {
  return dispatchDeliverableEmail(
    input,
    "Deliverable Submitted",
    enqueueDeliverableSubmittedEmail
  );
}

export async function dispatchExtensionRequestedEmail(
  input: ExtensionRequestedEmailDispatchInput
): Promise<void> {
  return dispatchDeliverableEmail(input, "Extension Requested", enqueueExtensionRequestedEmail);
}

export async function dispatchExtensionDecisionMadeEmail(
  input: ExtensionDecisionMadeEmailDispatchInput
): Promise<void> {
  return dispatchDeliverableEmail(
    input,
    "Extension Decision Made",
    enqueueExtensionDecisionMadeEmail
  );
}

export async function dispatchPublicCommentAddedEmail(
  input: PublicCommentAddedEmailDispatchInput
): Promise<void> {
  return dispatchDeliverableEmail(
    input,
    "Public Comment Added",
    enqueuePublicCommentAddedEmail
  );
}

export async function dispatchDeliverableDueDateUpdatedEmail(
  input: DeliverablePreviousDueDateEmailDispatchInput
): Promise<void> {
  return dispatchDeliverableEmail(
    input,
    "Deliverable Due Date Updated",
    (dispatchInput) =>
      enqueueDeliverablePreviousDueDateEmail(
        dispatchInput,
        "Deliverable Due Date Updated"
      )
  );
}

export async function dispatchResubmissionRequestedEmail(
  input: DeliverablePreviousDueDateEmailDispatchInput
): Promise<void> {
  return dispatchDeliverableEmail(input, "Resubmission Requested", (dispatchInput) =>
    enqueueDeliverablePreviousDueDateEmail(dispatchInput, "Resubmission Requested")
  );
}

export async function dispatchDeliverableCompletedEmail(
  input: DeliverableCompletedEmailDispatchInput
): Promise<void> {
  const emailTypeByFinalStatus: Record<FinalDeliverableStatus, string> = {
    Accepted: "Deliverable Accepted",
    Approved: "Deliverable Approved",
    "Received and Filed": "Deliverable Received and Filed",
  };
  const emailType = emailTypeByFinalStatus[input.finalStatus];

  return dispatchDeliverableEmail(input, emailType, (dispatchInput) =>
    enqueueDeliverableCompletedEmail(dispatchInput, emailType)
  );
}

async function dispatchDeliverableEmail<T extends DeliverableEmailContextInput>(
  input: T,
  emailType: string,
  enqueueEmail: (input: T) => Promise<string>
): Promise<void> {
  try {
    const messageId = await enqueueEmail(input);
    log.info(
      {
        messageId,
        deliverableId: input.deliverableId,
        emailType,
      },
      "Deliverable email dispatched"
    );
  } catch (error) {
    log.error(
      {
        error,
        deliverableId: input.deliverableId,
        emailType,
      },
      "Failed to dispatch deliverable email"
    );
  }
}

async function enqueuePublicCommentAddedEmail(
  input: PublicCommentAddedEmailDispatchInput
): Promise<string> {
  const deliverable = await prisma().deliverable.findUniqueOrThrow({
    where: { id: input.deliverableId },
    include: {
      cmsOwner: { include: { person: true } },
      demonstration: {
        include: {
          demonstrationRoleAssignments: {
            where: {
              roleId: { in: Array.from(ADMIN_DEMONSTRATION_ROLES) },
            },
            include: { person: true },
          },
        },
      },
    },
  });

  const bcc = deduplicateRecipients(
    [
      deliverable.cmsOwner.person,
      ...deliverable.demonstration.demonstrationRoleAssignments.map(
        (assignment) => assignment.person
      ),
    ],
    input.deliverableId,
    "Public Comment Added"
  );
  if (bcc.length === 0) {
    throw new Error(
      `Cannot dispatch Public Comment Added email for deliverable ${input.deliverableId}: ` +
        "no recipients were found."
    );
  }

  const message = buildRealtimeEmailEnvelope({
    emailType: "Public Comment Added",
    entityType: "deliverable",
    entityId: deliverable.id,
    triggeredById: input.triggeredByUserId,
    idempotencyKey: `Public Comment Added:public-comment:${input.publicCommentId}`,
    payload: {
      recipients: {
        to: [],
        bcc: bcc.map(({ name, address }) => ({ name, address })),
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

  return enqueueTrackedRealtimeEmail(
    message,
    undefined,
    bcc.map(({ personId, address }) => ({
      personId,
      emailAddress: address,
    }))
  );
}

async function enqueueDeliverablePreviousDueDateEmail(
  input: DeliverablePreviousDueDateEmailDispatchInput,
  emailType: string
): Promise<string> {
  const deliverable = await prisma().deliverable.findUniqueOrThrow({
    where: { id: input.deliverableId },
    include: {
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

  const bcc = deduplicateRecipients(
    deliverable.demonstration.demonstrationRoleAssignments.map(
      (assignment) => assignment.person
    ),
    input.deliverableId,
    emailType
  );

  if (bcc.length === 0) {
    throw new Error(
      `Cannot dispatch ${emailType} email for deliverable ${input.deliverableId}: ` +
        "no State Points of Contact were found on the demonstration."
    );
  }

  const message = buildRealtimeEmailEnvelope({
    emailType,
    entityType: "deliverable",
    entityId: deliverable.id,
    triggeredById: input.triggeredByUserId,
    idempotencyKey: `${emailType}:deliverable-action:${input.sourceActionId}`,
    payload: {
      recipients: {
        to: [],
        bcc: bcc.map(({ name, address }) => ({ name, address })),
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
        previousDueDate: input.previousDueDate.toISOString(),
        statusId: deliverable.statusId,
      },
    },
  });

  return enqueueTrackedRealtimeEmail(
    message,
    input.sourceActionId,
    bcc.map(({ personId, address }) => ({
      personId,
      emailAddress: address,
    }))
  );
}

async function enqueueExtensionDecisionMadeEmail(
  input: ExtensionDecisionMadeEmailDispatchInput
): Promise<string> {
  const deliverable = await prisma().deliverable.findUniqueOrThrow({
    where: { id: input.deliverableId },
    include: {
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

  const bcc = deduplicateRecipients(
    deliverable.demonstration.demonstrationRoleAssignments.map(
      (assignment) => assignment.person
    ),
    input.deliverableId,
    "Extension Decision Made"
  );
  if (bcc.length === 0) {
    throw new Error(
      `Cannot dispatch Extension Decision Made email for deliverable ${input.deliverableId}: ` +
        "no State Points of Contact were found on the demonstration."
    );
  }

  const message = buildRealtimeEmailEnvelope({
    emailType: "Extension Decision Made",
    entityType: "deliverable",
    entityId: deliverable.id,
    triggeredById: input.triggeredByUserId,
    idempotencyKey: `Extension Decision Made:deliverable-action:${input.sourceActionId}`,
    payload: {
      recipients: {
        to: [],
        bcc: bcc.map(({ name, address }) => ({ name, address })),
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
        previousDueDate: input.previousDueDate.toISOString(),
        extensionDecision: input.extensionDecision,
        statusId: deliverable.statusId,
      },
    },
  });

  return enqueueTrackedRealtimeEmail(
    message,
    input.sourceActionId,
    bcc.map(({ personId, address }) => ({
      personId,
      emailAddress: address,
    }))
  );
}

async function enqueueDeliverableCompletedEmail(
  input: DeliverableCompletedEmailDispatchInput,
  emailType: string
): Promise<string> {
  const deliverable = await prisma().deliverable.findUniqueOrThrow({
    where: { id: input.deliverableId },
    include: {
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

  const bcc = deduplicateRecipients(
    deliverable.demonstration.demonstrationRoleAssignments.map(
      (assignment) => assignment.person
    ),
    input.deliverableId,
    emailType
  );

  if (bcc.length === 0) {
    throw new Error(
      `Cannot dispatch ${emailType} email for deliverable ${input.deliverableId}: ` +
        "no State Points of Contact were found on the demonstration."
    );
  }

  const message = buildRealtimeEmailEnvelope({
    emailType,
    entityType: "deliverable",
    entityId: deliverable.id,
    triggeredById: input.triggeredByUserId,
    idempotencyKey: `${emailType}:deliverable-action:${input.sourceActionId}`,
    payload: {
      recipients: {
        to: [],
        bcc: bcc.map(({ name, address }) => ({ name, address })),
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

  return enqueueTrackedRealtimeEmail(
    message,
    input.sourceActionId,
    bcc.map(({ personId, address }) => ({
      personId,
      emailAddress: address,
    }))
  );
}

async function enqueueDeliverableCreatedEmail(
  input: DeliverableEmailDispatchInput
): Promise<string> {
  const deliverable = await prisma().deliverable.findUniqueOrThrow({
    where: { id: input.deliverableId },
    include: {
      cmsOwner: { include: { person: true } },
      demonstration: {
        include: {
          demonstrationRoleAssignments: {
            where: {
              roleId: { in: Array.from(CMS_USER_DEMONSTRATION_ROLES) },
            },
            include: { person: true },
          },
        },
      },
    },
  });

  const bcc = deduplicateRecipients(
    [
      deliverable.cmsOwner.person,
      ...deliverable.demonstration.demonstrationRoleAssignments.map(
        (assignment) => assignment.person
      ),
    ],
    input.deliverableId,
    "Deliverable Created"
  );

  if (bcc.length === 0) {
    throw new Error(
      `Cannot dispatch Deliverable Created email for deliverable ${input.deliverableId}: ` +
        "no recipients were found."
    );
  }

  const message = buildRealtimeEmailEnvelope({
    emailType: "Deliverable Created",
    entityType: "deliverable",
    entityId: deliverable.id,
    triggeredById: input.triggeredByUserId,
    idempotencyKey: `Deliverable Created:deliverable-action:${input.sourceActionId}`,
    payload: {
      recipients: {
        to: [],
        bcc: bcc.map(({ name, address }) => ({ name, address })),
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

  return enqueueTrackedRealtimeEmail(
    message,
    input.sourceActionId,
    bcc.map(({ personId, address }) => ({
      personId,
      emailAddress: address,
    }))
  );
}

async function enqueueMultipleDeliverablesCreatedEmail(
  input: MultipleDeliverablesCreatedEmailDispatchInput
): Promise<string> {
  if (input.deliverableIds.length < 2) {
    throw new Error(
      "Cannot dispatch Multiple Deliverables Created email with fewer than two deliverables."
    );
  }

  const rows = await prisma().deliverable.findMany({
    where: { id: { in: input.deliverableIds } },
    include: {
      cmsOwner: { include: { person: true } },
      demonstration: {
        include: {
          demonstrationRoleAssignments: {
            where: {
              roleId: { in: Array.from(CMS_USER_DEMONSTRATION_ROLES) },
            },
            include: { person: true },
          },
        },
      },
    },
  });
  const rowsById = new Map(rows.map((deliverable) => [deliverable.id, deliverable]));
  const deliverables = input.deliverableIds.map((id) => rowsById.get(id));
  const missingIds = input.deliverableIds.filter((id) => !rowsById.has(id));
  if (missingIds.length > 0) {
    throw new Error(
      `Cannot dispatch Multiple Deliverables Created email: deliverables not found: ${missingIds.join(", ")}.`
    );
  }

  const firstDeliverable = deliverables[0]!;
  if (
    deliverables.some(
      (deliverable) =>
        deliverable!.demonstrationId !== firstDeliverable.demonstrationId ||
        deliverable!.deliverableTypeId !== firstDeliverable.deliverableTypeId
    )
  ) {
    throw new Error(
      "Cannot dispatch Multiple Deliverables Created email for different demonstrations or deliverable types."
    );
  }

  const bcc = deduplicateRecipients(
    deliverables.flatMap((deliverable) => [
      deliverable!.cmsOwner.person,
      ...deliverable!.demonstration.demonstrationRoleAssignments.map(
        (assignment) => assignment.person
      ),
    ]),
    firstDeliverable.id,
    "Multiple Deliverables Created"
  );
  if (bcc.length === 0) {
    throw new Error(
      "Cannot dispatch Multiple Deliverables Created email: no recipients were found."
    );
  }

  const message = buildRealtimeEmailEnvelope({
    emailType: "Multiple Deliverables Created",
    entityType: "deliverable",
    entityId: firstDeliverable.id,
    triggeredById: input.triggeredByUserId,
    idempotencyKey:
      `Multiple Deliverables Created:deliverables:` +
      [...input.deliverableIds].sort().join(","),
    payload: {
      recipients: {
        to: [],
        bcc: bcc.map(({ name, address }) => ({ name, address })),
      },
      demonstration: {
        id: firstDeliverable.demonstration.id,
        name: firstDeliverable.demonstration.name,
        stateId: firstDeliverable.demonstration.stateId,
      },
      deliverables: deliverables.map((deliverable) => ({
        id: deliverable!.id,
        name: deliverable!.name,
        deliverableTypeId: deliverable!.deliverableTypeId,
        dueDate: deliverable!.dueDate.toISOString(),
        statusId: deliverable!.statusId,
      })),
    },
  });

  return enqueueTrackedRealtimeEmail(
    message,
    undefined,
    bcc.map(({ personId, address }) => ({
      personId,
      emailAddress: address,
    }))
  );
}

async function enqueueDeliverableSubmittedEmail(
  input: DeliverableEmailDispatchInput
): Promise<string> {
  return enqueueCmsOwnerDeliverableEmail(input, "Deliverable Submitted");
}

async function enqueueExtensionRequestedEmail(
  input: ExtensionRequestedEmailDispatchInput
): Promise<string> {
  return enqueueCmsOwnerDeliverableEmail(input, "Extension Requested", {
    requestedDueDate: input.requestedDueDate.toISOString(),
  });
}

async function enqueueCmsOwnerDeliverableEmail(
  input: DeliverableEmailDispatchInput,
  emailType: string,
  extraDeliverablePayload: Record<string, string> = {}
): Promise<string> {
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
      `Cannot dispatch ${emailType} email for deliverable ${input.deliverableId}: ` +
        `CMS owner ${deliverable.cmsOwner.person.id} has no email address.`
    );
  }

  const message = buildRealtimeEmailEnvelope({
    emailType,
    entityType: "deliverable",
    entityId: deliverable.id,
    triggeredById: input.triggeredByUserId,
    idempotencyKey: `${emailType}:deliverable-action:${input.sourceActionId}`,
    payload: {
      recipients: {
        to: [],
        bcc: [
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
        ...extraDeliverablePayload,
      },
    },
  });

  return enqueueTrackedRealtimeEmail(message, input.sourceActionId, [
    {
      personId: deliverable.cmsOwner.person.id,
      emailAddress: cmsOwnerEmail,
    },
  ]);
}

function deduplicateRecipients(
  people: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>,
  deliverableId: string,
  emailType: string
): ResolvedEmailRecipient[] {
  const recipients = new Map<string, ResolvedEmailRecipient>();

  for (const person of people) {
    const address = person.email.trim();
    if (!address) {
      throw new Error(
        `Cannot dispatch ${emailType} email for deliverable ${deliverableId}: ` +
          `person ${person.id} has no email address.`
      );
    }

    const normalizedAddress = address.toLowerCase();
    if (!recipients.has(normalizedAddress)) {
      recipients.set(normalizedAddress, {
        personId: person.id,
        name: `${person.firstName} ${person.lastName}`.trim(),
        address,
      });
    }
  }

  return Array.from(recipients.values());
}
