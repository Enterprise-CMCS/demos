import { formatDate } from "../formatDate.js";
import { read } from "../read.js";

const templateId = "systems-test";

export const systemsTestTemplate = {
  id: templateId,
  subject: "Dear Admin User, Email functionality is nominal",
  text: `Hello {{personGivenName}},

This email template system works.
This email was sent to {{userEmail}}

Thank you,

DEMOS Notifications

Action: Systems test

Current due date: {{currentDate}}`,
  html: `<p>Hello {{personGivenName}},</p>
<p>This email template system works.</p>
<p>This email was sent to {{userEmail}}</p>
<p>Thank you,</p>
<p>DEMOS Notifications</p>
<p>Action: Systems test</p>
<p>Current due date: {{currentDate}}</p>`,
  getViewModel(data, context) {
    return {
      personGivenName: read(data, "person.givenName", templateId),
      userEmail: read(data, "users.email", templateId),
      currentDate: formatDate(context.now),
    };
  },
};
