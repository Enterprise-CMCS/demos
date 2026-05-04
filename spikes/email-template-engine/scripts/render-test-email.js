const { renderEmail, saveCompletedRender } = require("..");
const { systemsTestData } = require("../fixtures/systems-test-data");

const templateId = "systems-test";
const payload = renderEmail(templateId, systemsTestData);
const filePath = saveCompletedRender(templateId, payload);

console.log(`Rendered ${templateId} email payload to ${filePath}`);
