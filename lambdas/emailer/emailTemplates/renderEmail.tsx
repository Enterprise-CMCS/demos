import { render, toPlainText } from "@react-email/render";
import type { ReactElement } from "react";

import { templates } from "./templates";
import type {
  EmailRecipient,
  EmailRecipientGroups,
  EmailTemplateDefinition,
  RenderedEmailPayload,
} from "./types";

export async function renderEmail(
  templateId: string,
  input: unknown,
  options: {
    now?: Date;
    templateRegistry?: Record<string, EmailTemplateDefinition<any, any>>;
  } = {}
): Promise<RenderedEmailPayload> {
  const templateRegistry = options.templateRegistry ?? templates;
  const template = templateRegistry[templateId];

  if (!template) {
    throw new Error(`Unknown email template: ${templateId}`);
  }

  const context = {
    now: options.now ?? new Date(),
  };
  const props = template.getProps(input, context);
  const Component = template.Component;
  const element = <Component {...props} /> as ReactElement;
  const html = await render(element);

  return {
    ...normalizeRecipientGroups(template.getRecipients(input)),
    subject: typeof template.subject === "function" ? template.subject(props) : template.subject,
    text: toPlainText(html),
    html,
  };
}

function normalizeRecipientGroups(recipients: EmailRecipientGroups): EmailRecipientGroups {
  if (!recipients || typeof recipients !== "object") {
    throw new Error("Email template must include recipient groups.");
  }

  return {
    to: normalizeRecipients(recipients.to, "to", true),
    ...(recipients.cc ? { cc: normalizeRecipients(recipients.cc, "cc") } : {}),
    ...(recipients.bcc ? { bcc: normalizeRecipients(recipients.bcc, "bcc") } : {}),
  };
}

function normalizeRecipients(
  recipients: EmailRecipient[],
  group: keyof EmailRecipientGroups,
  required = false
): EmailRecipient[] {
  if (!Array.isArray(recipients) || (required && recipients.length === 0)) {
    throw new Error("Email template must include at least one recipient.");
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
