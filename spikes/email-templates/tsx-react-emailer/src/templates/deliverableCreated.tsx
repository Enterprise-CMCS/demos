import { Link, Text } from "@react-email/components";

import { EmailLayout } from "../emailComponents/EmailLayout.tsx";
import { detailStyle, textStyle } from "../emailComponents/styles.ts";
import { read } from "../read.ts";
import type { TemplateDefinition } from "../types.ts";

const templateId = "deliverable-created";

type DeliverableCreatedProps = {
  currentDueDate: string;
  demonstrationTitle: string;
  deliverableName: string;
  deliverableType: string;
  dueDate: string;
  link: string;
  state: string;
};

function DeliverableCreatedEmail({
  currentDueDate,
  demonstrationTitle,
  deliverableName,
  deliverableType,
  dueDate,
  link,
  state,
}: DeliverableCreatedProps) {
  return (
    <EmailLayout>
      <Text style={textStyle}>Hello,</Text>
      <Text style={textStyle}>
        You have been assigned a new {deliverableType} deliverable for your Demonstration, due {dueDate}. View this deliverable and any required next steps in the DEMOS system: <Link href={link}>{link}</Link>.
      </Text>
      <Text style={textStyle}>Thank you,</Text>
      <Text style={textStyle}>DEMOS Notifications</Text>
      <Text style={detailStyle}>Demonstration: {demonstrationTitle}</Text>
      <Text style={detailStyle}>State: {state}</Text>
      <Text style={detailStyle}>Deliverable type: {deliverableType}</Text>
      <Text style={detailStyle}>Deliverable: {deliverableName}</Text>
      <Text style={detailStyle}>Action: Deliverable Created</Text>
      <Text style={detailStyle}>Current due date: {currentDueDate}</Text>
    </EmailLayout>
  );
}

export const deliverableCreatedTemplate: TemplateDefinition<DeliverableCreatedProps> = {
  id: templateId,
  subject: "CMS DEMOS Deliverable: Deliverable Created",
  Component: DeliverableCreatedEmail,
  getProps(data: unknown) {
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
