import { log } from "../../log";
import { prisma } from "../../prismaClient";
import { buildRealtimeEmailEnvelope } from "../../services/emailQueue";
import {
  CMS_USER_DEMONSTRATION_ROLES,
  STATE_USER_DEMONSTRATION_ROLES,
} from "../../constants";
import { enqueueTrackedRealtimeEmail } from "./emailNotification";
import { FinalDeliverableStatus, PersonType } from "../../types";

type DeliverableEmailContextInput = {
  deliverableId: string;
  triggeredByUserId: string;
};

type DeliverableEmailDispatchInput = DeliverableEmailContextInput & {
  sourceActionId: string;
};

type DeliverablePreviousDueDateEmailDispatchInput = DeliverableEmailDispatchInput & {
  previousDueDate: Date;
};

type ExtensionRequestedEmailDispatchInput = DeliverableEmailDispatchInput & {
  requestedDueDate: Date;
};

type DeliverableCompletedEmailDispatchInput = DeliverableEmailDispatchInput & {
  finalStatus: FinalDeliverableStatus;
};

type PublicCommentAddedEmailDispatchInput = DeliverableEmailContextInput & {
  authorPersonTypeId: PersonType;
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
              roleId: { in: Array.from(STATE_USER_DEMONSTRATION_ROLES) },
            },
            include: { person: true },
          },
        },
      },
    },
  });

  let recipientPeople;
  if (input.authorPersonTypeId === "demos-state-user") {
    recipientPeople = [deliverable.cmsOwner.person];
  } else if (
    input.authorPersonTypeId === "demos-cms-user" ||
    input.authorPersonTypeId === "demos-admin"
  ) {
    recipientPeople = deliverable.demonstration.demonstrationRoleAssignments.map(
      (assignment) => assignment.person
    );
  } else {
    throw new Error(
      `Cannot dispatch Public Comment Added email for deliverable ${input.deliverableId}: ` +
        `unsupported author person type ${input.authorPersonTypeId}.`
    );
  }

  const bcc = deduplicateRecipients(
    recipientPeople,
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
