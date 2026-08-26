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
  subject: "CMS DEMOS Deliverables: Multiple Deliverables Created",
  Component: MultipleDeliverablesEmail,
  getProps(input) {
    const deliverables = getRequiredValue(
      input.deliverables,
      "deliverables",
      "Multiple Deliverables Created"
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
      "Multiple Deliverables Created"
    );

    return {
      demonstrationTitle: getRequiredValue(
        input.demonstration?.name,
        "demonstration.name",
        "Multiple Deliverables Created"
      ),
      state: getRequiredValue(
        input.demonstration?.stateId,
        "demonstration.stateId",
        "Multiple Deliverables Created"
      ),
      deliverableType,
      deliverableNames: deliverables
        .map((deliverable, index) =>
          getRequiredValue(
            deliverable.name,
            `deliverables[${index}].name`,
            "Multiple Deliverables Created"
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
          "Multiple Deliverables Created"
        );
        return {
          dueDate: formatDate(
            getRequiredValue(
              deliverable.dueDate,
              `deliverables[${index}].dueDate`,
              "Multiple Deliverables Created"
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
      "Multiple Deliverables Created"
    );
  },
};

const deliverableEmailConfigs = [
  {
    emailType: "Deliverable Created",
    action: "Deliverable Created",
    Message: ({ currentDueDate, deliverableType, link }) => (
      <Text style={textStyle}>
        You have been assigned a new {deliverableType} deliverable for your Demonstration, due {currentDueDate}.{" "}
        <DeliverableLink href={link} />
      </Text>
    ),
  },
  {
    emailType: "Deliverable Due Date Updated",
    action: "Deliverable Due Date Updated",
    includePreviousDueDate: true,
    Message: ({ currentDueDate, deliverableType, link }) => (
      <Text style={textStyle}>
        A {deliverableType} deliverable has a new due date. Submission is now due on {currentDueDate}.{" "}
        <DeliverableLink href={link} />
      </Text>
    ),
  },
  {
    emailType: "Deliverable Submitted",
    action: "Deliverable Submitted",
    Message: ({ deliverableType, link }) => (
      <Text style={textStyle}>
        A {deliverableType} deliverable has been submitted for your Demonstration. <DeliverableLink href={link} />
      </Text>
    ),
  },
  {
    emailType: "Deliverable Accepted",
    action: "Accepted",
    Message: ({ deliverableType, link }) => (
      <Text style={textStyle}>
        CMS has Accepted a {deliverableType} deliverable. <DeliverableLink href={link} includeNextSteps={false} />
      </Text>
    ),
  },
  {
    emailType: "Deliverable Approved",
    action: "Approved",
    Message: ({ deliverableType, link }) => (
      <Text style={textStyle}>
        CMS has Approved a {deliverableType} deliverable. <DeliverableLink href={link} includeNextSteps={false} />
      </Text>
    ),
  },
  {
    emailType: "Deliverable Received and Filed",
    action: "Received and Filed",
    Message: ({ deliverableType, link }) => (
      <Text style={textStyle}>
        CMS has Received and Filed a {deliverableType} deliverable.{" "}
        <DeliverableLink href={link} includeNextSteps={false} />
      </Text>
    ),
  },
  {
    emailType: "Extension Requested",
    action: "Extension Requested",
    includeRequestedDueDate: true,
    Message: ({ currentDueDate, deliverableType, link }) => (
      <Text style={textStyle}>
        A state user has requested an extension for a {deliverableType} deliverable, originally due on {currentDueDate}.{" "}
        <DeliverableLink href={link} />
      </Text>
    ),
  },
  {
    emailType: "Extension Decision Made",
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
  {
    emailType: "Resubmission Requested",
    action: "Resubmission Requested",
    includePreviousDueDate: true,
    Message: ({ currentDueDate, deliverableType, link }) => (
      <Text style={textStyle}>
        CMS has requested a resubmission for a {deliverableType} deliverable, due on {currentDueDate}.{" "}
        <DeliverableLink href={link} />
      </Text>
    ),
  },
  {
    emailType: "Public Comment Added",
    action: "Public Comment Added",
    Message: ({ deliverableType, link }) => (
      <Text style={textStyle}>
        A public comment has been added to a {deliverableType} deliverable.{" "}
        <DeliverableLink href={link} />
      </Text>
    ),
  },
] satisfies DeliverableEmailConfig[];

export const deliverableEmailTemplates = {
  ...Object.fromEntries(
    deliverableEmailConfigs.map((config) => [
      config.emailType,
      createDeliverableEmailTemplate(config),
    ])
  ),
  "Multiple Deliverables Created": multipleDeliverablesCreatedTemplate,
} satisfies Record<string, EmailTemplateDefinition>;
