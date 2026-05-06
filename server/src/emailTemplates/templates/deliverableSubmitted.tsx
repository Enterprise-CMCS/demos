import { Link, Text } from "@react-email/components";

import { EmailLayout } from "../components/EmailLayout";
import { detailStyle, textStyle } from "../components/styles";
import { formatDate } from "../formatDate";
import { read } from "../read";
import type { EmailTemplateDefinition } from "../types";

const templateId = "deliverable-submitted";

type DeliverableEmailInput = {
  recipients: Array<{
    address: string;
    name?: string;
  }>;
  deliverable: {
    deliverableTypeId: string;
    dueDate: Date;
    name: string;
  };
  demonstration: {
    name: string;
    stateId: string;
  };
  link: string;
};

type DeliverableSubmittedProps = {
  currentDueDate: string;
  demonstrationTitle: string;
  deliverableName: string;
  deliverableType: string;
  link: string;
  state: string;
};

function DeliverableSubmittedEmail({
  currentDueDate,
  demonstrationTitle,
  deliverableName,
  deliverableType,
  link,
  state,
}: DeliverableSubmittedProps) {
  return (
    <EmailLayout>
      <Text style={textStyle}>Hello,</Text>
      <Text style={textStyle}>
        A {deliverableType} deliverable has been submitted for your Demonstration. View this
        deliverable and any required next steps in the DEMOS system: <Link href={link}>{link}</Link>
        .
      </Text>
      <Text style={textStyle}>Thank you,</Text>
      <Text style={textStyle}>DEMOS Notifications</Text>
      <Text style={detailStyle}>Demonstration: {demonstrationTitle}</Text>
      <Text style={detailStyle}>State: {state}</Text>
      <Text style={detailStyle}>Deliverable type: {deliverableType}</Text>
      <Text style={detailStyle}>Deliverable: {deliverableName}</Text>
      <Text style={detailStyle}>Action: Deliverable Submitted</Text>
      <Text style={detailStyle}>Current due date: {currentDueDate}</Text>
    </EmailLayout>
  );
}

export const deliverableSubmittedTemplate: EmailTemplateDefinition<
  DeliverableSubmittedProps,
  DeliverableEmailInput
> = {
  id: templateId,
  subject: "CMS DEMOS Deliverable: Deliverable Submitted",
  Component: DeliverableSubmittedEmail,
  getProps(input) {
    return {
      demonstrationTitle: read(input, "demonstration.name", templateId),
      state: read(input, "demonstration.stateId", templateId),
      deliverableType: read(input, "deliverable.deliverableTypeId", templateId),
      currentDueDate: formatDate(input.deliverable.dueDate),
      link: read(input, "link", templateId),
      deliverableName: read(input, "deliverable.name", templateId),
    };
  },
  getRecipients(input) {
    return input.recipients;
  },
};
