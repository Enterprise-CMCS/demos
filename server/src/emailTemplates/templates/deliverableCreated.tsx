import { Link, Text } from "@react-email/components";

import { EmailLayout } from "../components/EmailLayout";
import { detailStyle, textStyle } from "../components/styles";
import { formatDate } from "../formatDate";
import { read } from "../read";
import type { EmailTemplateDefinition } from "../types";

const templateId = "deliverable-created";

type DeliverableEmailInput = {
  cmsOwner: {
    person: {
      email: string;
      firstName: string;
      lastName: string;
    };
  };
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
        You have been assigned a new {deliverableType} deliverable for your Demonstration, due{" "}
        {dueDate}. View this deliverable and any required next steps in the DEMOS system:{" "}
        <Link href={link}>{link}</Link>.
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

export const deliverableCreatedTemplate: EmailTemplateDefinition<
  DeliverableCreatedProps,
  DeliverableEmailInput
> = {
  id: templateId,
  subject: "CMS DEMOS Deliverable: Deliverable Created",
  Component: DeliverableCreatedEmail,
  getProps(input) {
    const dueDate = input.deliverable.dueDate;

    return {
      demonstrationTitle: read(input, "demonstration.name", templateId),
      state: read(input, "demonstration.stateId", templateId),
      deliverableType: read(input, "deliverable.deliverableTypeId", templateId),
      dueDate: formatDate(dueDate),
      currentDueDate: formatDate(dueDate),
      link: read(input, "link", templateId),
      deliverableName: read(input, "deliverable.name", templateId),
    };
  },
  getRecipients(input) {
    const person = input.cmsOwner.person;

    return [
      {
        name: person.firstName + " " + person.lastName,
        address: person.email,
      },
    ];
  },
};
