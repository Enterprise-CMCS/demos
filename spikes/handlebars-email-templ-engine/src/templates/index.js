import { deliverableCreatedTemplate } from "./deliverableCreated.js";
import { deliverableSubmittedTemplate } from "./deliverableSubmitted.js";
import { systemsTestTemplate } from "./systemsTest.js";

export const templates = {
  [deliverableCreatedTemplate.id]: deliverableCreatedTemplate,
  [deliverableSubmittedTemplate.id]: deliverableSubmittedTemplate,
  [systemsTestTemplate.id]: systemsTestTemplate,
};
