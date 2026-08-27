import { Link, Text } from "@react-email/components";

import { EmailLayout } from "../components/EmailLayout";
import { detailStyle, textStyle } from "../components/styles";
import { formatDate, getDemosAppUrl, getRequiredValue } from "../helpers";
import type { EmailTemplateResult } from "../types";

const emailType = "Multiple Deliverables Created";

type DeliverableInput = {
  id?: string;
  name?: string;
  deliverableTypeId?: string;
  dueDate?: string;
};

type MultipleDeliverablesEmailProps = {
  demonstrationTitle: string;
  deliverableNames: string;
  deliverableType: string;
  deliverables: Array<{
    dueDate: string;
    link: string;
  }>;
  state: string;
};

export function renderMultipleDeliverablesEmail(
  input: unknown,
): EmailTemplateResult {
  const payload =
    input && typeof input === "object"
      ? (input as {
          demonstration?: {
            name?: string;
            stateId?: string;
          };
          deliverables?: DeliverableInput[];
        })
      : {};
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
        link: `${getDemosAppUrl()}/deliverables/${id}`,
      };
    }),
  };

  return {
    subject: "CMS DEMOS Deliverables: Multiple Deliverables Created",
    content: <MultipleDeliverablesEmail {...props} />,
  };
}

function MultipleDeliverablesEmail({
  demonstrationTitle,
  deliverableNames,
  deliverableType,
  deliverables,
  state,
}: MultipleDeliverablesEmailProps) {
  return (
    <EmailLayout>
      <Text style={textStyle}>Hello,</Text>
      <Text style={textStyle}>
        You have been assigned new {deliverableType} deliverables for your
        Demonstration. View these deliverables and any required next steps in
        the DEMOS system:
      </Text>
      {deliverables.map(({ dueDate, link }) => (
        <Text key={link} style={textStyle}>
          <Link href={link}>{link}</Link> due on {dueDate}
        </Text>
      ))}
      <Text style={textStyle}>Thank you,</Text>
      <Text style={textStyle}>DEMOS Notifications</Text>
      <Text style={detailStyle}>Demonstration: {demonstrationTitle}</Text>
      <Text style={detailStyle}>State: {state}</Text>
      <Text style={detailStyle}>Deliverable type: {deliverableType}</Text>
      <Text style={detailStyle}>Deliverables: {deliverableNames}</Text>
      <Text style={detailStyle}>Action: {emailType}</Text>
    </EmailLayout>
  );
}
