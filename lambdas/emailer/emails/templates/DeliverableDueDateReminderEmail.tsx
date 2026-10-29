import { Text } from "@react-email/components";

import { EmailLayout } from "../components/EmailLayout";
import { DeliverableLink } from "../components/deliverable/DeliverableLink";
import { detailStyle, textStyle } from "../components/styles";
import { formatDate, getDemosAppUrl, getRequiredObject, getRequiredString } from "../helpers";
import type { EmailTemplateResult } from "../types";

const emailType = "Deliverable Due Date Reminder";

export function renderDeliverableDueDateReminderEmail(rawPayload: unknown): EmailTemplateResult {
  const payload = getRequiredObject(rawPayload, "payload", emailType);
  const demonstration = getRequiredObject(payload.demonstration, "demonstration", emailType);
  const deliverable = getRequiredObject(payload.deliverable, "deliverable", emailType);
  const deliverableType = getRequiredString(
    deliverable.deliverableTypeId,
    "deliverable.deliverableTypeId",
    emailType
  );
  const currentDueDate = formatDate(
    getRequiredString(deliverable.dueDate, "deliverable.dueDate", emailType)
  );
  const status = getRequiredString(deliverable.statusId, "deliverable.statusId", emailType);
  const reminderStage = getRequiredString(payload.reminderStage, "reminderStage", emailType);

  let dueWhen: string;
  switch (reminderStage) {
    case "Five Days Prior":
      dueWhen = "due in 5 days";
      break;
    case "Due Today":
      dueWhen = "due today";
      break;
    case "Five Days After":
      dueWhen = "5 days past due";
      break;
    case "Ten Days After":
      dueWhen = "10 days past due";
      break;
    default:
      throw new Error(
        `Unrecognized reminderStage while rendering ${emailType}.data: ${reminderStage}`
      );
  }

  const link = `${getDemosAppUrl()}/deliverables/${getRequiredString(
    deliverable.id,
    "deliverable.id",
    emailType
  )}`;

  return {
    subject: `CMS DEMOS Deliverable: ${deliverableType} ${dueWhen}`,
    content: (
      <EmailLayout>
        <Text style={textStyle}>Hello,</Text>
        <Text style={textStyle}>
          This is an automated reminder from DEMOS that a {deliverableType} deliverable is {dueWhen}
          . <DeliverableLink href={link} includeNextSteps={false} />
        </Text>
        <Text style={textStyle}>Thank you,</Text>
        <Text style={textStyle}>DEMOS Notifications</Text>
        <Text style={detailStyle}>
          <strong>Demonstration:</strong>{" "}
          {getRequiredString(demonstration.name, "demonstration.name", emailType)}
        </Text>
        <Text style={detailStyle}>
          <strong>State:</strong>{" "}
          {getRequiredString(demonstration.stateName, "demonstration.stateName", emailType)}
        </Text>
        <Text style={detailStyle}>
          <strong>Deliverable type:</strong> {deliverableType}
        </Text>
        <Text style={detailStyle}>
          <strong>Deliverable:</strong>{" "}
          {getRequiredString(deliverable.name, "deliverable.name", emailType)}
        </Text>
        <Text style={detailStyle}>
          <strong>Reminder:</strong> {dueWhen}
        </Text>
        <Text style={detailStyle}>
          <strong>Due date:</strong> {currentDueDate}
        </Text>
        <Text style={detailStyle}>
          <strong>Status:</strong> {status}
        </Text>
      </EmailLayout>
    ),
  };
}
