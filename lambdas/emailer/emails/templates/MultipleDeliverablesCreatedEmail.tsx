import { Link, Text } from "@react-email/components";

import { EmailLayout } from "../components/EmailLayout";
import { detailStyle, textStyle } from "../components/styles";
import {
  formatDate,
  getDemosAppUrl,
  getRequiredObject,
  getRequiredString,
} from "../helpers";
import type { EmailTemplateResult } from "../types";

const emailType = "Multiple Deliverables Created";

export function renderMultipleDeliverablesCreatedEmail(
  rawPayload: unknown,
): EmailTemplateResult {
  const payload = getRequiredObject(rawPayload, "payload", emailType);
  const demonstration = getRequiredObject(
    payload.demonstration,
    "demonstration",
    emailType,
  );
  const deliverables = payload.deliverables;

  if (!Array.isArray(deliverables)) {
    throw new Error(`${emailType} email requires deliverables to be an array.`);
  }
  if (deliverables.length < 2) {
    throw new Error(`${emailType} email requires at least two deliverables.`);
  }

  const firstDeliverable = getRequiredObject(
    deliverables[0],
    "deliverables[0]",
    emailType,
  );
  const deliverableType = getRequiredString(
    firstDeliverable.deliverableTypeId,
    "deliverables[0].deliverableTypeId",
    emailType,
  );
  const validatedDeliverables = deliverables.map((value, index) => {
    const deliverable = getRequiredObject(
      value,
      `deliverables[${index}]`,
      emailType,
    );
    const currentDeliverableType = getRequiredString(
      deliverable.deliverableTypeId,
      `deliverables[${index}].deliverableTypeId`,
      emailType,
    );
    if (currentDeliverableType !== deliverableType) {
      throw new Error(`${emailType} email requires one deliverable type.`);
    }

    const id = getRequiredString(
      deliverable.id,
      `deliverables[${index}].id`,
      emailType,
    );

    return {
      dueDate: formatDate(
        getRequiredString(
          deliverable.dueDate,
          `deliverables[${index}].dueDate`,
          emailType,
        ),
      ),
      link: `${getDemosAppUrl()}/deliverables/${id}`,
      name: getRequiredString(
        deliverable.name,
        `deliverables[${index}].name`,
        emailType,
      ),
    };
  });

  const demonstrationTitle = getRequiredString(
    demonstration.name,
    "demonstration.name",
    emailType,
  );
  const state = getRequiredString(
    demonstration.stateId,
    "demonstration.stateId",
    emailType,
  );

  return {
    subject: "CMS DEMOS Deliverables: Multiple Deliverables Created",
    content: (
      <EmailLayout>
        <Text style={textStyle}>Hello,</Text>
        <Text style={textStyle}>
          You have been assigned new {deliverableType} deliverables for your
          Demonstration. View these deliverables and any required next steps in
          the DEMOS system:
        </Text>
        {validatedDeliverables.map(({ dueDate, link }) => (
          <Text key={link} style={textStyle}>
            <Link href={link}>{link}</Link> due on {dueDate}
          </Text>
        ))}
        <Text style={textStyle}>Thank you,</Text>
        <Text style={textStyle}>DEMOS Notifications</Text>
        <Text style={detailStyle}>Demonstration: {demonstrationTitle}</Text>
        <Text style={detailStyle}>State: {state}</Text>
        <Text style={detailStyle}>Deliverable type: {deliverableType}</Text>
        <Text style={detailStyle}>
          Deliverables:{" "}
          {validatedDeliverables.map(({ name }) => name).join(", ")}
        </Text>
        <Text style={detailStyle}>Action: {emailType}</Text>
      </EmailLayout>
    ),
  };
}
