import { Link, Text } from "@react-email/components";

import { EmailLayout } from "../components/EmailLayout";
import { formatDate, getDemosAppUrl, getRequiredObject, getRequiredString } from "../helpers";
import type { EmailTemplate } from "../types";

export const renderApplicationStatusUpdatedEmail: EmailTemplate = (payload) =>
  renderApplicationEmail(payload, "Application Status Updated");

export const renderApplicationDeemedCompleteEmail: EmailTemplate = (payload) =>
  renderApplicationEmail(payload, "Application Deemed Complete");

function renderApplicationEmail(
  rawPayload: unknown,
  emailType: "Application Status Updated" | "Application Deemed Complete"
) {
  const payload = getRequiredObject(rawPayload, "payload", emailType);
  const demonstration = getRequiredObject(payload.demonstration, "demonstration", emailType);
  const application = getRequiredObject(payload.application, "application", emailType);
  const demoId = getRequiredString(demonstration.id, "demonstration.id", emailType);
  const demoName = getRequiredString(demonstration.name, "demonstration.name", emailType);
  const state = getRequiredString(demonstration.stateId, "demonstration.stateId", emailType);
  const id = getRequiredString(application.id, "application.id", emailType);
  const applicationType = getRequiredString(
    application.applicationTypeId,
    "application.applicationTypeId",
    emailType
  );
  if (!["Demonstration", "Amendment", "Extension"].includes(applicationType)) {
    throw new Error(`Unsupported application type for email: ${applicationType}`);
  }
  const title =
    applicationType === "Demonstration"
      ? undefined
      : getRequiredString(application.name, "application.name", emailType);
  const status = getRequiredString(application.statusId, "application.statusId", emailType);
  const deemedComplete = emailType === "Application Deemed Complete";
  const dateField = deemedComplete ? "deemedCompleteDate" : "statusUpdatedAt";
  const rawDate = getRequiredString(application[dateField], `application.${dateField}`, emailType);
  const date = formatDate(rawDate);
  const timestamp = deemedComplete
    ? date
    : new Date(rawDate).toLocaleString("en-US", {
        timeZone: "America/New_York",
        timeZoneName: "short",
      });
  const url = new URL(`/demonstrations/${encodeURIComponent(demoId)}`, getDemosAppUrl());
  if (applicationType !== "Demonstration") {
    url.searchParams.set(applicationType === "Amendment" ? "amendment" : "renewal", id);
  }

  return {
    subject: deemedComplete
      ? "CMS DEMOS: Application Deemed Complete"
      : `CMS DEMOS: Application Status Changed to ${status}`,
    content: (
      <EmailLayout>
        <Text>Hello,</Text>
        <Text>
          {deemedComplete
            ? `This message confirms that the application for your Demonstration has been deemed complete as of ${date}. You can view the application record in DEMOS: `
            : "The application status for your Demonstration has been updated in DEMOS. View this application and any next steps in the DEMOS system: "}
          <Link href={url.href}>{url.href}</Link>.
        </Text>
        <Text>
          Thank you,
          <br />
          DEMOS Notifications
        </Text>
        <Text>
          <strong>Demonstration:</strong> {demoName}
        </Text>
        <Text>
          <strong>State:</strong> {state}
        </Text>
        <Text>
          <strong>Application Type:</strong> {applicationType}
        </Text>
        {title !== undefined && (
          <Text>
            <strong>Application Title:</strong> {title}
          </Text>
        )}
        <Text>
          <strong>Status:</strong> {status}
        </Text>
        <Text>
          <strong>{deemedComplete ? "Date deemed complete:" : "Date:"}</strong> {timestamp}
        </Text>
      </EmailLayout>
    ),
  };
}
