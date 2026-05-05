import React from "react";
import { Text } from "@react-email/components";

import { EmailLayout } from "../emailComponents/EmailLayout.js";
import { textStyle } from "../emailComponents/styles.js";
import { formatDate } from "../formatDate.js";
import { read } from "../read.js";

const templateId = "systems-test";

function SystemsTestEmail({ personGivenName, userEmail, currentDate }) {
  return React.createElement(
    EmailLayout,
    { preview: "This email template system works." },
    React.createElement(Text, { style: textStyle }, `Hello ${personGivenName},`),
    React.createElement(Text, { style: textStyle }, "This email template system works."),
    React.createElement(Text, { style: textStyle }, `This email was sent to ${userEmail} ✌️`),
    React.createElement(Text, { style: textStyle }, "Thank you,"),
    React.createElement(Text, { style: textStyle }, "DEMOS Notifications"),
    React.createElement(Text, { style: textStyle }, "Action: Systems test"),
    React.createElement(Text, { style: textStyle }, `Current due date: ${currentDate}`),
  );
}

export const systemsTestTemplate = {
  id: templateId,
  subject: "Dear Admin User, Email functionality is nominal",
  Component: SystemsTestEmail,
  getProps(data, context) {
    return {
      personGivenName: read(data, "person.givenName", templateId),
      userEmail: read(data, "users.email", templateId),
      currentDate: formatDate(context.now),
    };
  },
};
