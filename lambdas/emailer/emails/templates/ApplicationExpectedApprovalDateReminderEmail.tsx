import { Link, Text } from "@react-email/components";

import { EmailLayout } from "../components/EmailLayout";
import { detailStyle, textStyle } from "../components/styles";
import { formatDate, getDemosAppUrl, getRequiredObject, getRequiredString } from "../helpers";
import type { EmailTemplateResult } from "../types";

const emailType = "Application Expected Approval Date Reminder";

// getApplicationData currently only queries for applications exactly 7 days out
const DAYS_UNTIL_EXPECTED_APPROVAL = 7;

export function renderApplicationExpectedApprovalDateReminderEmail(
  rawPayload: unknown
): EmailTemplateResult {
  const payload = getRequiredObject(rawPayload, "payload", emailType);
  const application = getRequiredObject(payload.application, "application", emailType);
  const applicationTypeId = getRequiredString(
    application.applicationTypeId,
    "application.applicationTypeId",
    emailType
  );
  const expectedApprovalDate = formatDate(
    getRequiredString(
      application.expectedApprovalDate,
      "application.expectedApprovalDate",
      emailType
    )
  );
  const isDemonstration = applicationTypeId === "Demonstration";
  const demonstrationTitle = isDemonstration
    ? getRequiredString(application.name, "application.name", emailType)
    : getRequiredString(
        application.parentDemonstrationName,
        "application.parentDemonstrationName",
        emailType
      );

  const link = `${getDemosAppUrl()}/demonstrations/${
    isDemonstration
      ? getRequiredString(application.id, "application.id", emailType)
      : getRequiredString(
          application.parentDemonstrationId,
          "application.parentDemonstrationId",
          emailType
        )
  }`;

  return {
    subject: "CMS DEMOS: Application Expected Approval Date Upcoming",
    content: (
      <EmailLayout>
        <Text style={textStyle}>Hello,</Text>
        <Text style={textStyle}>
          This is an automated reminder that an application associated with your Demonstration has
          an upcoming expected approval date. View this application and any next steps in the DEMOS
          system: <Link href={link}>{link}</Link>.
        </Text>
        <Text style={textStyle}>Thank you,</Text>
        <Text style={textStyle}>DEMOS Notifications</Text>
        <Text style={detailStyle}>Demonstration: {demonstrationTitle}</Text>
        <Text style={detailStyle}>
          State: {getRequiredString(application.stateId, "application.stateId", emailType)}
        </Text>
        <Text style={detailStyle}>
          Days Until Expected Approval: {DAYS_UNTIL_EXPECTED_APPROVAL}
        </Text>
        <Text style={detailStyle}>Expected approval date: {expectedApprovalDate}</Text>
        <Text style={detailStyle}>Application Type: {applicationTypeId}</Text>
        {!isDemonstration && (
          <Text style={detailStyle}>
            Application Title: {getRequiredString(application.name, "application.name", emailType)}
          </Text>
        )}
      </EmailLayout>
    ),
  };
}
