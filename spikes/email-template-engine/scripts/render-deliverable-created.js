const { renderEmail, saveCompletedRender } = require("..");
const { deliverableCreatedData } = require("../fixtures/deliverable-created-data");

const templateId = "deliverable-created";
const payload = renderEmail(templateId, deliverableCreatedData);
const filePath = saveCompletedRender(templateId, payload);

console.log(`Rendered ${templateId} email payload to ${filePath}`);
