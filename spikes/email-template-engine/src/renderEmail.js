const { templates } = require("./templates");
const { templateVariables } = require("./templateVariables");

function renderEmail(templateId, data, options = {}) {
  const templateRegistry = options.templateRegistry || templates;
  const variableRegistry = options.variableRegistry || templateVariables;
  const context = {
    now: options.now || new Date(),
  };
  const template = templateRegistry[templateId];

  if (!template) {
    throw new Error(`Unknown email template: ${templateId}`);
  }

  const to = normalizeRecipients(getRequiredValue(data, "recipients.to", templateId, "recipients"));

  return {
    to,
    subject: renderTemplatePart(template.subject, variableRegistry, data, context, templateId, "subject"),
    text: renderTemplatePart(template.text, variableRegistry, data, context, templateId, "text"),
    html: renderTemplatePart(template.html, variableRegistry, data, context, templateId, "html"),
  };
}

function renderTemplatePart(source, variables, data, context, templateId, partName) {
  return Object.entries(variables).reduce((rendered, [token, resolver]) => {
    if (!rendered.includes(token)) {
      return rendered;
    }

    const value = getTemplateVariableValue(data, context, resolver, templateId, partName, token);
    return rendered.replace(new RegExp(escapeRegExp(token), "g"), String(value));
  }, source);
}

function getTemplateVariableValue(data, context, resolver, templateId, partName, token) {
  if (typeof resolver === "function") {
    const value = resolver(data, context);

    if (value === undefined || value === null || value === "") {
      throw new Error(`Missing value for ${token} while rendering ${templateId}.${partName}`);
    }

    return value;
  }

  return getRequiredValue(data, resolver, templateId, partName, token);
}

function getRequiredValue(data, dataPath, templateId, partName, token) {
  const value = dataPath.split(".").reduce((current, key) => {
    if (current === undefined || current === null) {
      return undefined;
    }

    return current[key];
  }, data);

  if (value === undefined || value === null || value === "") {
    const prefix = token ? `Missing value for ${token}` : `Missing value for ${dataPath}`;
    throw new Error(`${prefix} at ${dataPath} while rendering ${templateId}.${partName}`);
  }

  return value;
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  renderEmail,
};
