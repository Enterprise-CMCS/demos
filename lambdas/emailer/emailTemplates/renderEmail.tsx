import { render, toPlainText } from "@react-email/render";
import type { ReactElement } from "react";

import { templates } from "./templates";
import type { EmailRecipient, EmailTemplateDefinition, RenderedEmailPayload } from "./types";

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
    to: normalizeRecipients(template.getRecipients(input)),
    subject: typeof template.subject === "function" ? template.subject(props) : template.subject,
    text: toPlainText(html),
    html,
  };
}

function normalizeRecipients(recipients: EmailRecipient[]): EmailRecipient[] {
  if (!Array.isArray(recipients) || recipients.length === 0) {
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

    throw new Error(`Invalid email recipient at index ${index}.`);
  });
}
