import { deliverableCreatedTemplate } from "./deliverableCreated";
import { deliverableSubmittedTemplate } from "./deliverableSubmitted";
import type { EmailTemplateDefinition } from "../types";

export const templates: Record<string, EmailTemplateDefinition<any, any>> = {
  [deliverableCreatedTemplate.id]: deliverableCreatedTemplate,
  [deliverableSubmittedTemplate.id]: deliverableSubmittedTemplate,
};
