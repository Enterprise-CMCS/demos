const systemsTestTemplate = {
  id: "systems-test",
  subject: "Dear Admin User, Email functionality is nominal",
  text: `Hello <Person.Given Name>,

This email template system works.
This email was sent to <users.email>

Thank you,

DEMOS Notifications

Action: Systems test

Current due date: <Current Date>`,
  html: `<p>Hello <Person.Given Name>,</p>
<p>This email template system works.<br>This email was sent to <users.email></p>
<p>Thank you,</p>
<p>DEMOS Notifications</p>
<p><strong>Action:</strong> Systems test</p>
<p><strong>Current due date:</strong> <Current Date></p>`,
};

module.exports = {
  systemsTestTemplate,
};
