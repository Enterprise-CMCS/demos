import { deliverableEmailTemplates } from "./deliverableEmails";
import { referenceEmailTemplates } from "./referenceEmails";
import type { EmailTemplateDefinition } from "../types";

export const templates: Record<string, EmailTemplateDefinition<any, any>> = {
  ...deliverableEmailTemplates,
  ...referenceEmailTemplates,
};
