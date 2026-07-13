import { deliverableCreatedTemplate } from "./deliverableCreated";
import type { EmailTemplateDefinition } from "../types";

export const templates: Record<string, EmailTemplateDefinition<any, any>> = {
  [deliverableCreatedTemplate.id]: deliverableCreatedTemplate,
};
