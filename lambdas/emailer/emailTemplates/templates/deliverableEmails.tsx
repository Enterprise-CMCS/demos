import { Text } from "@react-email/components";
import type { ReactNode } from "react";

import { textStyle } from "../components/styles";
import { formatDate, getRequiredValue } from "../EmailHelper";
import {
  DeliverableEmail,
  type DeliverableEmailProps,
} from "../parts/DeliverableEmail";
import { DeliverableLink } from "../parts/DeliverableLink";
import {
  MultipleDeliverablesEmail,
  type MultipleDeliverablesEmailProps,
} from "../parts/MultipleDeliverablesEmail";
import type { EmailTemplateResult } from "../types";

const demosAppUrl = "http://localhost:3000";

type DeliverableEmailType =
  | "Deliverable Created"
  | "Deliverable Due Date Updated"
  | "Deliverable Submitted"
  | "Deliverable Accepted"
  | "Deliverable Approved"
  | "Deliverable Received and Filed"
  | "Extension Requested"
  | "Extension Decision Made"
  | "Resubmission Requested"
  | "Public Comment Added";

type DeliverableInput = {
  id?: string;
  name?: string;
  deliverableTypeId?: string;
  dueDate?: string;
  extensionDecision?: "Approved" | "Denied";
  previousDueDate?: string;
  requestedDueDate?: string;
};

type DeliverablePayload = {
  demonstration?: {
    name?: string;
    stateId?: string;
  };
  deliverable?: DeliverableInput;
};

type DeliverableEmailConfig = {
  action: string;
  includePreviousDueDate?: boolean;
  includeRequestedDueDate?: boolean;
  requiresExtensionDecision?: boolean;
  message(props: DeliverableEmailProps): ReactNode;
};

const deliverableEmailConfigs: Record<
  DeliverableEmailType,
  DeliverableEmailConfig
> = {
  "Deliverable Created": {
    action: "Deliverable Created",
    message: ({ currentDueDate, deliverableType, link }) => (
      <Text style={textStyle}>
        You have been assigned a new {deliverableType} deliverable for your
        Demonstration, due {currentDueDate}. <DeliverableLink href={link} />
      </Text>
    ),
  },
  "Deliverable Due Date Updated": {
    action: "Deliverable Due Date Updated",
    includePreviousDueDate: true,
    message: ({ currentDueDate, deliverableType, link }) => (
      <Text style={textStyle}>
        A {deliverableType} deliverable has a new due date. Submission is now
        due on {currentDueDate}. <DeliverableLink href={link} />
      </Text>
    ),
  },
  "Deliverable Submitted": {
    action: "Deliverable Submitted",
    message: ({ deliverableType, link }) => (
      <Text style={textStyle}>
        A {deliverableType} deliverable has been submitted for your
        Demonstration. <DeliverableLink href={link} />
      </Text>
    ),
  },
  "Deliverable Accepted": {
    action: "Accepted",
    message: ({ deliverableType, link }) => (
      <Text style={textStyle}>
        CMS has Accepted a {deliverableType} deliverable.{" "}
        <DeliverableLink href={link} includeNextSteps={false} />
      </Text>
    ),
  },
  "Deliverable Approved": {
    action: "Approved",
    message: ({ deliverableType, link }) => (
      <Text style={textStyle}>
        CMS has Approved a {deliverableType} deliverable.{" "}
        <DeliverableLink href={link} includeNextSteps={false} />
      </Text>
    ),
  },
  "Deliverable Received and Filed": {
    action: "Received and Filed",
    message: ({ deliverableType, link }) => (
      <Text style={textStyle}>
        CMS has Received and Filed a {deliverableType} deliverable.{" "}
        <DeliverableLink href={link} includeNextSteps={false} />
      </Text>
    ),
  },
  "Extension Requested": {
    action: "Extension Requested",
    includeRequestedDueDate: true,
    message: ({ currentDueDate, deliverableType, link }) => (
      <Text style={textStyle}>
        A state user has requested an extension for a {deliverableType}{" "}
        deliverable, originally due on {currentDueDate}.{" "}
        <DeliverableLink href={link} />
      </Text>
    ),
  },
  "Extension Decision Made": {
    action: "Extension Decision Made",
    includePreviousDueDate: true,
    requiresExtensionDecision: true,
    message: ({ currentDueDate, deliverableType, extensionDecision, link }) => (
      <Text style={textStyle}>
        CMS has {extensionDecision} an extension request for your{" "}
        {deliverableType} deliverable. The current due date is {currentDueDate}.{" "}
        <DeliverableLink href={link} />
      </Text>
    ),
  },
  "Resubmission Requested": {
    action: "Resubmission Requested",
    includePreviousDueDate: true,
    message: ({ currentDueDate, deliverableType, link }) => (
      <Text style={textStyle}>
        CMS has requested a resubmission for a {deliverableType} deliverable,
        due on {currentDueDate}. <DeliverableLink href={link} />
      </Text>
    ),
  },
  "Public Comment Added": {
    action: "Public Comment Added",
    message: ({ deliverableType, link }) => (
      <Text style={textStyle}>
        A public comment has been added to a {deliverableType} deliverable.{" "}
        <DeliverableLink href={link} />
      </Text>
    ),
  },
};

export function renderDeliverableEmail(
  emailType: DeliverableEmailType,
  input: unknown,
): EmailTemplateResult {
  const config = deliverableEmailConfigs[emailType];
  const props = getDeliverableProps(input, emailType, config);

  return {
    subject: `CMS DEMOS Deliverable: ${config.action}`,
    content: (
      <DeliverableEmail {...props} action={config.action}>
        {config.message(props)}
      </DeliverableEmail>
    ),
  };
}

export function renderMultipleDeliverablesEmail(
  input: unknown,
): EmailTemplateResult {
  const payload = getPayload<{
    demonstration?: DeliverablePayload["demonstration"];
    deliverables?: DeliverableInput[];
  }>(input);
  const emailType = "Multiple Deliverables Created";
  const deliverables = getRequiredValue(
    payload.deliverables,
    "deliverables",
    emailType,
  );

  if (!Array.isArray(deliverables)) {
    throw new Error(`${emailType} email requires deliverables to be an array.`);
  }
  if (deliverables.length < 2) {
    throw new Error(`${emailType} email requires at least two deliverables.`);
  }

  const deliverableType = getRequiredValue(
    deliverables[0].deliverableTypeId,
    "deliverables[0].deliverableTypeId",
    emailType,
  );
  const props: MultipleDeliverablesEmailProps = {
    demonstrationTitle: getRequiredValue(
      payload.demonstration?.name,
      "demonstration.name",
      emailType,
    ),
    state: getRequiredValue(
      payload.demonstration?.stateId,
      "demonstration.stateId",
      emailType,
    ),
    deliverableType,
    deliverableNames: deliverables
      .map((deliverable, index) =>
        getRequiredValue(
          deliverable.name,
          `deliverables[${index}].name`,
          emailType,
        ),
      )
      .join(", "),
    deliverables: deliverables.map((deliverable, index) => {
      if (deliverable.deliverableTypeId !== deliverableType) {
        throw new Error(`${emailType} email requires one deliverable type.`);
      }

      const id = getRequiredValue(
        deliverable.id,
        `deliverables[${index}].id`,
        emailType,
      );
      return {
        dueDate: formatDate(
          getRequiredValue(
            deliverable.dueDate,
            `deliverables[${index}].dueDate`,
            emailType,
          ),
        ),
        link: `${demosAppUrl}/deliverables/${id}`,
      };
    }),
  };

  return {
    subject: "CMS DEMOS Deliverables: Multiple Deliverables Created",
    content: <MultipleDeliverablesEmail {...props} />,
  };
}

function getDeliverableProps(
  input: unknown,
  emailType: DeliverableEmailType,
  config: DeliverableEmailConfig,
): DeliverableEmailProps {
  const payload = getPayload<DeliverablePayload>(input);
  const deliverable = payload.deliverable;
  const deliverableId = getRequiredValue(
    deliverable?.id,
    "deliverable.id",
    emailType,
  );

  const props: DeliverableEmailProps = {
    demonstrationTitle: getRequiredValue(
      payload.demonstration?.name,
      "demonstration.name",
      emailType,
    ),
    state: getRequiredValue(
      payload.demonstration?.stateId,
      "demonstration.stateId",
      emailType,
    ),
    deliverableType: getRequiredValue(
      deliverable?.deliverableTypeId,
      "deliverable.deliverableTypeId",
      emailType,
    ),
    deliverableName: getRequiredValue(
      deliverable?.name,
      "deliverable.name",
      emailType,
    ),
    currentDueDate: formatDate(
      getRequiredValue(deliverable?.dueDate, "deliverable.dueDate", emailType),
    ),
    link: `${demosAppUrl}/deliverables/${deliverableId}`,
  };

  if (config.includePreviousDueDate) {
    props.previousDueDate = formatDate(
      getRequiredValue(
        deliverable?.previousDueDate,
        "deliverable.previousDueDate",
        emailType,
      ),
    );
  }
  if (config.includeRequestedDueDate) {
    props.requestedDueDate = formatDate(
      getRequiredValue(
        deliverable?.requestedDueDate,
        "deliverable.requestedDueDate",
        emailType,
      ),
    );
  }
  if (config.requiresExtensionDecision) {
    props.extensionDecision = getRequiredValue(
      deliverable?.extensionDecision,
      "deliverable.extensionDecision",
      emailType,
    );
  }

  return props;
}

function getPayload<T extends object>(input: unknown): Partial<T> {
  return input && typeof input === "object" ? (input as Partial<T>) : {};
}
