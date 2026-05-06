import React from "react";
import { render, toPlainText } from "@react-email/render";

import { getRequiredValue } from "./getRequiredValue.js";
import { templates } from "./templates/index.js";

export async function renderEmail(templateId, data, options = {}) {
  const templateRegistry = options.templateRegistry || templates;
  const context = {
    now: options.now || new Date(),
  };
  const template = templateRegistry[templateId];

  if (!template) {
    throw new Error(`Unknown email template: ${templateId}`);
  }

  const to = normalizeRecipients(getRequiredValue(data, "recipients.to", templateId, "recipients"));
  const props = template.getProps(data, context);
  const element = React.createElement(template.Component, props);
  const html = await render(element);

  return {
    to,
    subject: typeof template.subject === "function" ? template.subject(props) : template.subject,
    text: toPlainText(html),
    html,
  };
}

function normalizeRecipients(recipients) {
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
      typeof recipient.address === "string" &&
      recipient.address.trim()
    ) {
      return {
        ...recipient,
        address: recipient.address,
      };
    }

    throw new Error(`Invalid recipient at recipients.to[${index}]`);
  });
}
