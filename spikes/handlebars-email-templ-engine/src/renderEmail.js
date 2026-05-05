import Handlebars from "handlebars";

import { getRequiredValue } from "./getRequiredValue.js";
import { templates } from "./templates/index.js";

export function renderEmail(templateId, data, options = {}) {
  const templateRegistry = options.templateRegistry || templates;
  const context = {
    now: options.now || new Date(),
  };
  const template = templateRegistry[templateId];

  if (!template) {
    throw new Error(`Unknown email template: ${templateId}`);
  }

  const to = normalizeRecipients(getRequiredValue(data, "recipients.to", templateId, "recipients"));
  const viewModel = template.getViewModel(data, context);

  return {
    to,
    subject: renderPart(template.subject, viewModel, templateId, "subject", { noEscape: true }),
    text: renderPart(template.text, viewModel, templateId, "text", { noEscape: true }),
    html: renderPart(template.html, viewModel, templateId, "html"),
  };
}

function renderPart(source, viewModel, templateId, partName, options = {}) {
  try {
    return Handlebars.compile(source, {
      noEscape: options.noEscape || false,
      strict: true,
    })(viewModel);
  } catch (error) {
    throw new Error(`Failed to render ${templateId}.${partName}: ${error.message}`);
  }
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
