import { render, toPlainText } from "@react-email/render";
import type { ReactElement } from "react";

import { getRequiredValue } from "./getRequiredValue.ts";
import { templates } from "./templates/index.ts";
import type { EmailPayload, Recipient, RenderContext, TemplateDefinition } from "./types.ts";

export async function renderEmail(templateId: string, data: unknown, options: {
  now?: Date;
  templateRegistry?: Record<string, TemplateDefinition<object>>;
} = {}): Promise<EmailPayload> {
  const templateRegistry = options.templateRegistry ?? templates;
  const context: RenderContext = {
    now: options.now ?? new Date(),
  };
  const template = templateRegistry[templateId];

  if (!template) {
    throw new Error(`Unknown email template: ${templateId}`);
  }

  const to = normalizeRecipients(getRequiredValue(data, "recipients.to", templateId, "recipients"));
  const props = template.getProps(data, context);
  const Component = template.Component;
  const element = <Component {...props} /> as ReactElement;
  const html = await render(element);

  return {
    to,
    subject: typeof template.subject === "function" ? template.subject(props) : template.subject,
    text: toPlainText(html),
    html,
  };
}

function normalizeRecipients(recipients: unknown): Recipient[] {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new Error("recipients.to must include at least one recipient");
  }

  return recipients.map((recipient, index) => {
    if (typeof recipient === "string" && recipient.trim()) {
      return recipient;
    }

    if (
      recipient &&
      typeof recipient === "object" &&
      typeof (recipient as Record<string, unknown>).address === "string" &&
      String((recipient as Record<string, unknown>).address).trim()
    ) {
      return recipient as Recipient;
    }

    throw new Error(`Invalid recipient at recipients.to[${index}]`);
  });
}
