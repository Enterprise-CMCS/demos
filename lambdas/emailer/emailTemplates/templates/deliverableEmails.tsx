import { Text } from "@react-email/components";

import { textStyle } from "../components/styles";
import { createDeliverableEmailTemplate } from "../parts/createDeliverableEmailTemplate";
import { DeliverableLink } from "../parts/DeliverableLink";
import type { DeliverableEmailConfig } from "../parts/types";
import type {
  MultipleDeliverablesEmailInput,
  MultipleDeliverablesEmailProps,
} from "../parts/types";
import { MultipleDeliverablesEmail } from "../parts/MultipleDeliverablesEmail";
import { formatDate, getRequiredValue } from "../EmailHelper";
import type { EmailRecipientGroups } from "../types";
import type { EmailTemplateDefinition } from "../types";

const demosAppUrl = "http://localhost:3000";

const multipleDeliverablesCreatedTemplate: EmailTemplateDefinition<
  MultipleDeliverablesEmailProps,
  MultipleDeliverablesEmailInput
> = {
  id: "multiple-deliverables-created",
  subject: "CMS DEMOS Deliverables: Multiple Deliverables Created",
  Component: MultipleDeliverablesEmail,
  getProps(input) {
    const deliverables = getRequiredValue(
      input.deliverables,
      "deliverables",
      "multiple-deliverables-created"
    );
    if (deliverables.length < 2) {
      throw new Error(
        "Multiple Deliverables Created email requires at least two deliverables."
      );
    }

    const firstDeliverable = deliverables[0];
    const deliverableType = getRequiredValue(
      firstDeliverable.deliverableTypeId,
      "deliverables[0].deliverableTypeId",
      "multiple-deliverables-created"
    );

    return {
      demonstrationTitle: getRequiredValue(
        input.demonstration?.name,
        "demonstration.name",
        "multiple-deliverables-created"
      ),
      state: getRequiredValue(
        input.demonstration?.stateId,
        "demonstration.stateId",
        "multiple-deliverables-created"
      ),
      deliverableType,
      deliverableNames: deliverables
        .map((deliverable, index) =>
          getRequiredValue(
            deliverable.name,
            `deliverables[${index}].name`,
            "multiple-deliverables-created"
          )
        )
        .join(", "),
      deliverables: deliverables.map((deliverable, index) => {
        if (deliverable.deliverableTypeId !== deliverableType) {
          throw new Error(
            "Multiple Deliverables Created email requires one deliverable type."
          );
        }
        const id = getRequiredValue(
          deliverable.id,
          `deliverables[${index}].id`,
          "multiple-deliverables-created"
        );
        return {
          dueDate: formatDate(
            getRequiredValue(
              deliverable.dueDate,
              `deliverables[${index}].dueDate`,
              "multiple-deliverables-created"
            )
          ),
          link: `${demosAppUrl}/deliverables/${id}`,
        };
      }),
    };
  },
  getRecipients(input) {
    return getRequiredValue<EmailRecipientGroups>(
      input.recipients,
      "recipients",
      "multiple-deliverables-created"
    );
  },
};

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
  "deliverable-due-date-updated": {
    id: "deliverable-due-date-updated",
    action: "Deliverable Due Date Updated",
    includePreviousDueDate: true,
    Message: ({ currentDueDate, deliverableType, link }) => (
      <Text style={textStyle}>
        A {deliverableType} deliverable has a new due date. Submission is now due on {currentDueDate}.{" "}
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
    action: "Accepted",
    Message: ({ deliverableType, link }) => (
      <Text style={textStyle}>
        CMS has Accepted a {deliverableType} deliverable. <DeliverableLink href={link} includeNextSteps={false} />
      </Text>
    ),
  },
  "deliverable-approved": {
    id: "deliverable-approved",
    action: "Approved",
    Message: ({ deliverableType, link }) => (
      <Text style={textStyle}>
        CMS has Approved a {deliverableType} deliverable. <DeliverableLink href={link} includeNextSteps={false} />
      </Text>
    ),
  },
  "deliverable-received-and-filed": {
    id: "deliverable-received-and-filed",
    action: "Received and Filed",
    Message: ({ deliverableType, link }) => (
      <Text style={textStyle}>
        CMS has Received and Filed a {deliverableType} deliverable.{" "}
        <DeliverableLink href={link} includeNextSteps={false} />
      </Text>
    ),
  },
  "extension-requested": {
    id: "extension-requested",
    action: "Extension Requested",
    includeRequestedDueDate: true,
    Message: ({ currentDueDate, deliverableType, link }) => (
      <Text style={textStyle}>
        A state user has requested an extension for a {deliverableType} deliverable, originally due on {currentDueDate}.{" "}
        <DeliverableLink href={link} />
      </Text>
    ),
  },
  "extension-decision-made": {
    id: "extension-decision-made",
    action: "Extension Decision Made",
    includePreviousDueDate: true,
    requiresExtensionDecision: true,
    Message: ({ currentDueDate, deliverableType, extensionDecision, link }) => (
      <Text style={textStyle}>
        CMS has {extensionDecision} an extension request for your {deliverableType} deliverable. The current due date is {currentDueDate}.{" "}
        <DeliverableLink href={link} />
      </Text>
    ),
  },
  "resubmission-requested": {
    id: "resubmission-requested",
    action: "Resubmission Requested",
    includePreviousDueDate: true,
    Message: ({ currentDueDate, deliverableType, link }) => (
      <Text style={textStyle}>
        CMS has requested a resubmission for a {deliverableType} deliverable, due on {currentDueDate}.{" "}
        <DeliverableLink href={link} />
      </Text>
    ),
  },
  "public-comment-added": {
    id: "public-comment-added",
    action: "Public Comment Added",
    Message: ({ deliverableType, link }) => (
      <Text style={textStyle}>
        A public comment has been added to a {deliverableType} deliverable.{" "}
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

deliverableEmailTemplates[multipleDeliverablesCreatedTemplate.id] =
  multipleDeliverablesCreatedTemplate;
