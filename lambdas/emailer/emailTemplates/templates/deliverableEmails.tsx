import { Text } from "@react-email/components";

import { textStyle } from "../components/styles";
import { createDeliverableEmailTemplate } from "../parts/createDeliverableEmailTemplate";
import { DeliverableLink } from "../parts/DeliverableLink";
import type { DeliverableEmailConfig } from "../parts/types";
import type { EmailTemplateDefinition } from "../types";

export const deliverableEmailConfigById = {
  "deliverable-created": {
    id: "deliverable-created",
    action: "Deliverable Created",
    Message: ({ currentDueDate, deliverableType, link }) => (
      <Text style={textStyle}>
        You have been assigned a new {deliverableType} deliverable for your Demonstration, due {currentDueDate}.{" "}
        <DeliverableLink href={link} />
      </Text>
    ),
  },
  "deliverable-submitted": {
    id: "deliverable-submitted",
    action: "Deliverable Submitted",
    Message: ({ deliverableType, link }) => (
      <Text style={textStyle}>
        A {deliverableType} deliverable has been submitted for your Demonstration. <DeliverableLink href={link} />
      </Text>
    ),
  },
  "deliverable-accepted": {
    id: "deliverable-accepted",
    action: "Deliverable Accepted",
    Message: ({ deliverableType, link }) => (
      <Text style={textStyle}>
        Your {deliverableType} deliverable has been accepted. <DeliverableLink href={link} />
      </Text>
    ),
  },
  "deliverable-approved": {
    id: "deliverable-approved",
    action: "Deliverable Approved",
    Message: ({ deliverableType, link }) => (
      <Text style={textStyle}>
        Your {deliverableType} deliverable has been approved. <DeliverableLink href={link} />
      </Text>
    ),
  },
  "deliverable-received-and-filed": {
    id: "deliverable-received-and-filed",
    action: "Deliverable Received and Filed",
    Message: ({ deliverableType, link }) => (
      <Text style={textStyle}>
        Your {deliverableType} deliverable has been received and filed.{" "}
        <DeliverableLink href={link} />
      </Text>
    ),
  },
} satisfies Record<string, DeliverableEmailConfig>;

export const deliverableEmailTemplates = Object.fromEntries(
  Object.values(deliverableEmailConfigById).map((config) => {
    const template = createDeliverableEmailTemplate(config);
    return [template.id, template];
  })
) as Record<string, EmailTemplateDefinition>;
