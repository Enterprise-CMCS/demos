import { Link, Text } from "@react-email/components";

import { EmailLayout } from "../emailComponents/EmailLayout.tsx";
import { detailStyle, textStyle } from "../emailComponents/styles.ts";
import { read } from "../read.ts";
import type { TemplateDefinition } from "../types.ts";

const templateId = "deliverable-submitted";

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
        A {deliverableType} deliverable has been submitted for your Demonstration. View this deliverable and any required next steps in the DEMOS system: <Link href={link}>{link}</Link>.
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

export const deliverableSubmittedTemplate: TemplateDefinition<DeliverableSubmittedProps> = {
  id: templateId,
  subject: "CMS DEMOS Deliverable: Deliverable Submitted",
  Component: DeliverableSubmittedEmail,
  getProps(data: unknown) {
    return {
      demonstrationTitle: read(data, "demonstration.title", templateId),
      state: read(data, "demonstration.state", templateId),
      deliverableType: read(data, "deliverable.type", templateId),
      currentDueDate: read(data, "deliverable.currentDueDate", templateId),
      link: read(data, "deliverable.link", templateId),
      deliverableName: read(data, "deliverable.name", templateId),
    };
  },
};
