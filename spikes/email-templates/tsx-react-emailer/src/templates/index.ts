import { deliverableCreatedTemplate } from "./deliverableCreated.tsx";
import { deliverableSubmittedTemplate } from "./deliverableSubmitted.tsx";
import { systemsTestTemplate } from "./systemsTest.tsx";
import type { TemplateDefinition } from "../types.ts";

export const templates = {
  [deliverableCreatedTemplate.id]: deliverableCreatedTemplate,
  [deliverableSubmittedTemplate.id]: deliverableSubmittedTemplate,
  [systemsTestTemplate.id]: systemsTestTemplate,
} satisfies Record<string, TemplateDefinition<any>>;
