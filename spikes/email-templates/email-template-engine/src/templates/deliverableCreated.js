import React from "react";
import { Link, Text } from "@react-email/components";

import { EmailLayout } from "../emailComponents/EmailLayout.js";
import { detailStyle, textStyle } from "../emailComponents/styles.js";
import { read } from "../read.js";

const templateId = "deliverable-created";

function DeliverableCreatedEmail({
  currentDueDate,
  demonstrationTitle,
  deliverableName,
  deliverableType,
  dueDate,
  link,
  state,
}) {
  return React.createElement(
    EmailLayout,
    null,
    React.createElement(Text, { style: textStyle }, "Hello,"),
    React.createElement(
      Text,
      { style: textStyle },
      `You have been assigned a new ${deliverableType} deliverable for your Demonstration, due ${dueDate}. View this deliverable and any required next steps in the DEMOS system: `,
      React.createElement(Link, { href: link }, link),
      ".",
    ),
    React.createElement(Text, { style: textStyle }, "Thank you,"),
    React.createElement(Text, { style: textStyle }, "DEMOS Notifications"),
    React.createElement(Text, { style: detailStyle }, `Demonstration: ${demonstrationTitle}`),
    React.createElement(Text, { style: detailStyle }, `State: ${state}`),
    React.createElement(Text, { style: detailStyle }, `Deliverable type: ${deliverableType}`),
    React.createElement(Text, { style: detailStyle }, `Deliverable: ${deliverableName}`),
    React.createElement(Text, { style: detailStyle }, "Action: Deliverable Created"),
    React.createElement(Text, { style: detailStyle }, `Current due date: ${currentDueDate}`),
  );
}

export const deliverableCreatedTemplate = {
  id: templateId,
  subject: "CMS DEMOS Deliverable: Deliverable Created",
  Component: DeliverableCreatedEmail,
  getProps(data) {
    return {
      demonstrationTitle: read(data, "demonstration.title", templateId),
      state: read(data, "demonstration.state", templateId),
      deliverableType: read(data, "deliverable.type", templateId),
      dueDate: read(data, "deliverable.dueDate", templateId),
      currentDueDate: read(data, "deliverable.currentDueDate", templateId),
      link: read(data, "deliverable.link", templateId),
      deliverableName: read(data, "deliverable.name", templateId),
    };
  },
};
