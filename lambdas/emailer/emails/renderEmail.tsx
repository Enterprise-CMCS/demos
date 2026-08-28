import { render, toPlainText } from "@react-email/render";

import { getRequiredObject } from "./helpers";
import { renderDeliverableAcceptedEmail } from "./templates/DeliverableAcceptedEmail";
import { renderDeliverableApprovedEmail } from "./templates/DeliverableApprovedEmail";
import { renderDeliverableCreatedEmail } from "./templates/DeliverableCreatedEmail";
import { renderDeliverableDueDateUpdatedEmail } from "./templates/DeliverableDueDateUpdatedEmail";
import { renderDeliverableReceivedAndFiledEmail } from "./templates/DeliverableReceivedAndFiledEmail";
import { renderDeliverableSubmittedEmail } from "./templates/DeliverableSubmittedEmail";
import { renderExtensionDecisionMadeEmail } from "./templates/ExtensionDecisionMadeEmail";
import { renderExtensionRequestedEmail } from "./templates/ExtensionRequestedEmail";
import { renderMultipleDeliverablesCreatedEmail } from "./templates/MultipleDeliverablesCreatedEmail";
import { renderPublicCommentAddedEmail } from "./templates/PublicCommentAddedEmail";
import { renderResubmissionRequestedEmail } from "./templates/ResubmissionRequestedEmail";
import type {
  EmailRecipient,
  EmailRecipientGroups,
  EmailTemplate,
  RenderedEmailPayload,
} from "./types";

// Template creation
const templates: Record<string, EmailTemplate> = {
  "Deliverable Created": renderDeliverableCreatedEmail,
  "Deliverable Due Date Updated": renderDeliverableDueDateUpdatedEmail,
  "Deliverable Submitted": renderDeliverableSubmittedEmail,
  "Deliverable Accepted": renderDeliverableAcceptedEmail,
  "Deliverable Approved": renderDeliverableApprovedEmail,
  "Deliverable Received and Filed": renderDeliverableReceivedAndFiledEmail,
  "Extension Requested": renderExtensionRequestedEmail,
  "Extension Decision Made": renderExtensionDecisionMadeEmail,
  "Resubmission Requested": renderResubmissionRequestedEmail,
  "Public Comment Added": renderPublicCommentAddedEmail,
  "Multiple Deliverables Created": renderMultipleDeliverablesCreatedEmail,
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
  const payload = getRequiredObject(input, "payload", emailType);
  const recipients = getRequiredObject(
    payload.recipients,
    "recipients",
    emailType,
  );
  return normalizeRecipientGroups(recipients);
}

function normalizeRecipientGroups(
  recipients: Record<string, unknown>,
): EmailRecipientGroups {
  const normalizedRecipients = {
    to: normalizeRecipients(recipients.to, "to"),
    ...(recipients.cc !== undefined
      ? { cc: normalizeRecipients(recipients.cc, "cc") }
      : {}),
    ...(recipients.bcc !== undefined
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
  recipients: unknown,
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
