const { formatDate } = require("./formatDate");

const templateVariables = {
  "<Person.Given Name>": "person.givenName",
  "<users.email>": "users.email",
  "<Current Date>": (_data, context) => formatDate(context.now),
  "<Deliverable Type>": "deliverable.type",
  "<Due Date>": "deliverable.dueDate",
  "<Link>": "deliverable.link",
  "<Demonstration Title>": "demonstration.title",
  "<State>": "demonstration.state",
  "<Deliverable Name>": "deliverable.name",
  "<Current Due Date>": "deliverable.currentDueDate",
};

module.exports = {
  templateVariables,
};
