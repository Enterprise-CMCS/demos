import { Text } from "@react-email/components";

import { EmailLayout } from "../components/EmailLayout";
import { detailStyle, textStyle } from "../components/styles";
import { formatDate } from "../formatDate";
import { read } from "../read";
import type { EmailTemplateDefinition } from "../types";

const templateId = "deliverable-created";

type DeliverableCreatedInput = {
  to: string;
  id: string;
  name: string;
  deliverableType: string;
  dueDate: string;
  status: string;
};

type DeliverableCreatedProps = {
  deliverableName: string;
  deliverableType: string;
  dueDate: string;
  status: string;
};

function DeliverableCreatedEmail({
  deliverableName,
  deliverableType,
  dueDate,
  status,
}: DeliverableCreatedProps) {
  return (
    <EmailLayout>
      <Text style={textStyle}>Hello,</Text>
      <Text style={textStyle}>
        You created a {deliverableType} deliverable named {deliverableName}, due {dueDate}.
      </Text>
      <Text style={textStyle}>Thank you,</Text>
      <Text style={textStyle}>DEMOS Notifications</Text>
      <Text style={detailStyle}>Deliverable type: {deliverableType}</Text>
      <Text style={detailStyle}>Deliverable: {deliverableName}</Text>
      <Text style={detailStyle}>Action: Deliverable Created</Text>
      <Text style={detailStyle}>Current due date: {dueDate}</Text>
      <Text style={detailStyle}>Status: {status}</Text>
    </EmailLayout>
  );
}

export const deliverableCreatedTemplate: EmailTemplateDefinition<
  DeliverableCreatedProps,
  DeliverableCreatedInput
> = {
  id: templateId,
  subject: "CMS DEMOS Deliverable: Deliverable Created",
  Component: DeliverableCreatedEmail,
  getProps(input) {
    return {
      deliverableName: read(input, "name", templateId),
      deliverableType: read(input, "deliverableType", templateId),
      dueDate: formatDate(read(input, "dueDate", templateId)),
      status: read(input, "status", templateId),
    };
  },
  getRecipients(input) {
    return [read(input, "to", templateId)];
  },
};
