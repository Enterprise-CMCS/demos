import { EmailValidationError } from "../../emailValidationError";
import { Link, Text } from "@react-email/components";

import { EmailLayout } from "../components/EmailLayout";
import { detailStyle, textStyle } from "../components/styles";
import {
  formatDate,
  getDemosAppUrl,
  getRequiredObject,
  getRequiredString,
  getRequiredValue,
} from "../helpers";
import type { EmailTemplateResult } from "../types";

const emailType = "Demonstration Expiration Date Reminder";

export function renderDemonstrationExpirationReminderEmail(
  rawPayload: unknown
): EmailTemplateResult {
  const payload = getRequiredObject(rawPayload, "payload", emailType);
  const demonstration = getRequiredObject(payload.demonstration, "demonstration", emailType);
  const reminderStage = getRequiredString(payload.reminderStage, "reminderStage", emailType);
  const isStateUser = getRequiredValue(payload.isStateUser, "isStateUser", emailType);
  const currentExpirationDate = formatDate(
    getRequiredString(demonstration.expirationDate, "demonstration.expirationDate", emailType)
  );
  let dueWhen: string;
  switch (reminderStage) {
    case "Thirty Days Prior":
      dueWhen = "30";
      break;
    case "Sixty Days Prior":
      dueWhen = "60";
      break;
    case "Ninety Days Prior":
      dueWhen = "90";
      break;
    default:
      throw new EmailValidationError(
        `Unrecognized reminderStage while rendering ${emailType}.data: ${reminderStage}`
      );
  }

  const link = `${getDemosAppUrl()}/demonstrations/${getRequiredString(
    demonstration.id,
    "demonstration.id",
    emailType
  )}`;

  return {
    subject: `CMS DEMOS: Demonstration Expiring`,
    content: (
      <EmailLayout>
        <Text style={textStyle}>Hello,</Text>
        <Text style={textStyle}>
          This is an automated reminder from DEMOS that your demonstration is approaching its
          expiration date in {dueWhen} days.
        </Text>
        {isStateUser ? (
          <Text style={textStyle}>
            Please reach out to your project officer to discuss an extension or other actions.
          </Text>
        ) : (
          <Text style={textStyle}>
            View this demonstration and any extension details in the DEMOS system:{" "}
            <Link href={link}>{link}</Link>.
          </Text>
        )}
        <Text style={textStyle}>Thank you,</Text>
        <Text style={textStyle}>DEMOS Notifications</Text>
        <Text style={detailStyle}>
          Demonstration: {getRequiredString(demonstration.name, "demonstration.name", emailType)}
        </Text>
        <Text style={detailStyle}>
          State: {getRequiredString(demonstration.stateId, "demonstration.stateId", emailType)}
        </Text>
        <Text style={detailStyle}>Days Until Expiration: {dueWhen}</Text>
        <Text style={detailStyle}>Expiration Date: {currentExpirationDate}</Text>
      </EmailLayout>
    ),
  };
}
