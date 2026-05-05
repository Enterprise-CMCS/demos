import { formatDate } from "./formatDate.js";
import { getRequiredValue } from "./getRequiredValue.js";

export function buildSystemsTestProps(data, context) {
  return {
    personGivenName: read(data, "person.givenName", "systems-test"),
    userEmail: read(data, "users.email", "systems-test"),
    currentDate: formatDate(context.now),
  };
}

export function buildDeliverableCreatedProps(data) {
  return {
    demonstrationTitle: read(data, "demonstration.title", "deliverable-created"),
    state: read(data, "demonstration.state", "deliverable-created"),
    deliverableType: read(data, "deliverable.type", "deliverable-created"),
    dueDate: read(data, "deliverable.dueDate", "deliverable-created"),
    currentDueDate: read(data, "deliverable.currentDueDate", "deliverable-created"),
    link: read(data, "deliverable.link", "deliverable-created"),
    deliverableName: read(data, "deliverable.name", "deliverable-created"),
  };
}

function read(data, path, templateId) {
  return getRequiredValue(data, path, templateId, "data");
}
