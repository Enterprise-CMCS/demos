import { render, toPlainText } from "@react-email/render";

import { renderDeliverableEmail } from "./templates/DeliverableEmail";
import {
  renderMultipleDeliverablesEmail,
} from "./templates/MultipleDeliverablesEmail";
import { renderReferenceTermsEmail } from "./templates/referenceEmails";
import type {
  EmailRecipient,
  EmailRecipientGroups,
  EmailTemplate,
  RenderedEmailPayload,
} from "./types";

const templates: Record<string, EmailTemplate> = {
  "Deliverable Created": (input) =>
    renderDeliverableEmail("Deliverable Created", input),
  "Deliverable Due Date Updated": (input) =>
    renderDeliverableEmail("Deliverable Due Date Updated", input),
  "Deliverable Submitted": (input) =>
    renderDeliverableEmail("Deliverable Submitted", input),
  "Deliverable Accepted": (input) =>
    renderDeliverableEmail("Deliverable Accepted", input),
  "Deliverable Approved": (input) =>
    renderDeliverableEmail("Deliverable Approved", input),
  "Deliverable Received and Filed": (input) =>
    renderDeliverableEmail("Deliverable Received and Filed", input),
  "Extension Requested": (input) =>
    renderDeliverableEmail("Extension Requested", input),
  "Extension Decision Made": (input) =>
    renderDeliverableEmail("Extension Decision Made", input),
  "Resubmission Requested": (input) =>
    renderDeliverableEmail("Resubmission Requested", input),
  "Public Comment Added": (input) =>
    renderDeliverableEmail("Public Comment Added", input),
  "Multiple Deliverables Created": renderMultipleDeliverablesEmail,
  "Terms And Conditions Requested": renderReferenceTermsEmail,
};

export async function renderEmail(
  emailType: string,
  input: unknown,
): Promise<RenderedEmailPayload> {
  const template = templates[emailType];

  if (!template) {
    throw new Error(`Unsupported email type: ${emailType}`);
  }

  const recipients = getRecipients(input, emailType);
  const { content, ...email } = await template(input);
  const html = await render(content);

  return {
    ...recipients,
    ...email,
    text: toPlainText(html),
    html,
  };
}

function getRecipients(
  input: unknown,
  emailType: string,
): EmailRecipientGroups {
  const recipients =
    input && typeof input === "object"
      ? (input as { recipients?: EmailRecipientGroups }).recipients
      : undefined;

  if (!recipients) {
    throw new Error(
      `Missing value for recipients while rendering ${emailType}.data`,
    );
  }

  return normalizeRecipientGroups(recipients);
}

function normalizeRecipientGroups(
  recipients: EmailRecipientGroups,
): EmailRecipientGroups {
  if (!recipients || typeof recipients !== "object") {
    throw new Error("Email template must include recipient groups.");
  }

  const normalizedRecipients = {
    to: normalizeRecipients(recipients.to, "to"),
    ...(recipients.cc ? { cc: normalizeRecipients(recipients.cc, "cc") } : {}),
    ...(recipients.bcc
      ? { bcc: normalizeRecipients(recipients.bcc, "bcc") }
      : {}),
  };

  const recipientCount =
    normalizedRecipients.to.length +
    (normalizedRecipients.cc?.length ?? 0) +
    (normalizedRecipients.bcc?.length ?? 0);
  if (recipientCount === 0) {
    throw new Error("Email template must include at least one recipient.");
  }

  return normalizedRecipients;
}

function normalizeRecipients(
  recipients: EmailRecipient[],
  group: keyof EmailRecipientGroups,
): EmailRecipient[] {
  if (!Array.isArray(recipients)) {
    throw new Error(`Email template ${group} recipients must be an array.`);
  }

  return recipients.map((recipient, index) => {
    if (typeof recipient === "string" && recipient.trim()) {
      return recipient;
    }

    if (
      recipient &&
      typeof recipient === "object" &&
      typeof recipient.address === "string" &&
      recipient.address.trim()
    ) {
      return recipient;
    }

    throw new Error(`Invalid ${group} email recipient at index ${index}.`);
  });
}
