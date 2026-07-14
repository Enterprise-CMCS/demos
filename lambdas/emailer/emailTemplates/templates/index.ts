import { deliverableEmailTemplates } from "./deliverableEmails";
import type { EmailTemplateDefinition } from "../types";

export const templates: Record<string, EmailTemplateDefinition<any, any>> = {
  ...deliverableEmailTemplates,
};
