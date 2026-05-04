const { deliverableCreatedTemplate } = require("./deliverableCreated");
const { systemsTestTemplate } = require("./systemsTest");

const templates = {
  [deliverableCreatedTemplate.id]: deliverableCreatedTemplate,
  [systemsTestTemplate.id]: systemsTestTemplate,
};

module.exports = {
  templates,
};
