import { Text } from "@react-email/components";

import { EmailLayout } from "../components/EmailLayout";
import { detailStyle, textStyle } from "../components/styles";
import { getDemosAppUrl } from "../config";
import { formatDate, getRequiredValue } from "../EmailHelper";
import { DeliverableLink } from "../parts/DeliverableLink";
import type { EmailTemplateResult } from "../types";

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

type DeliverableEmailProps = {
  currentDueDate: string;
  demonstrationTitle: string;
  deliverableName: string;
  deliverableType: string;
  extensionDecision?: "Approved" | "Denied";
  link: string;
  previousDueDate?: string;
  requestedDueDate?: string;
  state: string;
};

export function renderDeliverableEmail(
  emailType: DeliverableEmailType,
  input: unknown,
): EmailTemplateResult {
  const props = getDeliverableProps(input, emailType);
  const action = getAction(emailType);

  return {
    subject: `CMS DEMOS Deliverable: ${action}`,
    content: <DeliverableEmail {...props} emailType={emailType} />,
  };
}

function DeliverableEmail({
  currentDueDate,
  demonstrationTitle,
  deliverableName,
  deliverableType,
  emailType,
  extensionDecision,
  link,
  previousDueDate,
  requestedDueDate,
  state,
}: DeliverableEmailProps & { emailType: DeliverableEmailType }) {
  const action = getAction(emailType);

  return (
    <EmailLayout>
      <Text style={textStyle}>Hello,</Text>
      {getMessage(emailType, {
        currentDueDate,
        deliverableType,
        extensionDecision,
        link,
      })}
      <Text style={textStyle}>Thank you,</Text>
      <Text style={textStyle}>DEMOS Notifications</Text>
      <Text style={detailStyle}>Demonstration: {demonstrationTitle}</Text>
      <Text style={detailStyle}>State: {state}</Text>
      <Text style={detailStyle}>Deliverable type: {deliverableType}</Text>
      <Text style={detailStyle}>Deliverable: {deliverableName}</Text>
      <Text style={detailStyle}>Action: {action}</Text>
      {previousDueDate && (
        <Text style={detailStyle}>Previous due date: {previousDueDate}</Text>
      )}
      <Text style={detailStyle}>Current due date: {currentDueDate}</Text>
      {requestedDueDate && (
        <Text style={detailStyle}>Requested due date: {requestedDueDate}</Text>
      )}
    </EmailLayout>
  );
}

function getMessage(
  emailType: DeliverableEmailType,
  {
    currentDueDate,
    deliverableType,
    extensionDecision,
    link,
  }: Pick<
    DeliverableEmailProps,
    "currentDueDate" | "deliverableType" | "extensionDecision" | "link"
  >,
) {
  switch (emailType) {
    case "Deliverable Created":
      return (
        <Text style={textStyle}>
          You have been assigned a new {deliverableType} deliverable for your
          Demonstration, due {currentDueDate}. <DeliverableLink href={link} />
        </Text>
      );
    case "Deliverable Due Date Updated":
      return (
        <Text style={textStyle}>
          A {deliverableType} deliverable has a new due date. Submission is now
          due on {currentDueDate}. <DeliverableLink href={link} />
        </Text>
      );
    case "Deliverable Submitted":
      return (
        <Text style={textStyle}>
          A {deliverableType} deliverable has been submitted for your
          Demonstration. <DeliverableLink href={link} />
        </Text>
      );
    case "Deliverable Accepted":
    case "Deliverable Approved":
    case "Deliverable Received and Filed":
      return (
        <Text style={textStyle}>
          CMS has {getAction(emailType)} a {deliverableType} deliverable.{" "}
          <DeliverableLink href={link} includeNextSteps={false} />
        </Text>
      );
    case "Extension Requested":
      return (
        <Text style={textStyle}>
          A state user has requested an extension for a {deliverableType}{" "}
          deliverable, originally due on {currentDueDate}.{" "}
          <DeliverableLink href={link} />
        </Text>
      );
    case "Extension Decision Made":
      return (
        <Text style={textStyle}>
          CMS has {extensionDecision} an extension request for your{" "}
          {deliverableType} deliverable. The current due date is {currentDueDate}.{" "}
          <DeliverableLink href={link} />
        </Text>
      );
    case "Resubmission Requested":
      return (
        <Text style={textStyle}>
          CMS has requested a resubmission for a {deliverableType} deliverable,
          due on {currentDueDate}. <DeliverableLink href={link} />
        </Text>
      );
    case "Public Comment Added":
      return (
        <Text style={textStyle}>
          A public comment has been added to a {deliverableType} deliverable.{" "}
          <DeliverableLink href={link} />
        </Text>
      );
  }
}

function getDeliverableProps(
  input: unknown,
  emailType: DeliverableEmailType,
): DeliverableEmailProps {
  const payload =
    input && typeof input === "object" ? (input as DeliverablePayload) : {};
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
    link: `${getDemosAppUrl()}/deliverables/${deliverableId}`,
  };

  if (
    emailType === "Deliverable Due Date Updated" ||
    emailType === "Extension Decision Made" ||
    emailType === "Resubmission Requested"
  ) {
    props.previousDueDate = formatDate(
      getRequiredValue(
        deliverable?.previousDueDate,
        "deliverable.previousDueDate",
        emailType,
      ),
    );
  }

  if (emailType === "Extension Requested") {
    props.requestedDueDate = formatDate(
      getRequiredValue(
        deliverable?.requestedDueDate,
        "deliverable.requestedDueDate",
        emailType,
      ),
    );
  }

  if (emailType === "Extension Decision Made") {
    props.extensionDecision = getRequiredValue(
      deliverable?.extensionDecision,
      "deliverable.extensionDecision",
      emailType,
    );
  }

  return props;
}

function getAction(emailType: DeliverableEmailType): string {
  switch (emailType) {
    case "Deliverable Accepted":
      return "Accepted";
    case "Deliverable Approved":
      return "Approved";
    case "Deliverable Received and Filed":
      return "Received and Filed";
    default:
      return emailType;
  }
}
