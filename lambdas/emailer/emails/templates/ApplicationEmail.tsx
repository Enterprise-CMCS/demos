import { Link, Text } from "@react-email/components";

import { EmailLayout } from "../components/EmailLayout";
import { getDemosAppUrl, getRequiredObject, getRequiredString } from "../helpers";
import type { EmailTemplate } from "../types";

export const renderApplicationStatusUpdatedEmail: EmailTemplate = (payload) =>
  renderApplicationEmail(payload, "Application Status Updated");

function renderApplicationEmail(
  rawPayload: unknown,
  emailType: "Application Status Updated"
) {
  const payload = getRequiredObject(rawPayload, "payload", emailType);
  const demonstration = getRequiredObject(payload.demonstration, "demonstration", emailType);
  const application = getRequiredObject(payload.application, "application", emailType);
  const demoId = getRequiredString(demonstration.id, "demonstration.id", emailType);
  const demoName = getRequiredString(demonstration.name, "demonstration.name", emailType);
  const state = getRequiredString(demonstration.stateName, "demonstration.stateName", emailType);
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
  const rawDate = getRequiredString(application.statusUpdatedAt, "application.statusUpdatedAt", emailType);
  const timestamp = new Date(rawDate).toLocaleString("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "short",
  });
  const url = new URL(`/demonstrations/${encodeURIComponent(demoId)}`, getDemosAppUrl());
  if (applicationType !== "Demonstration") {
    url.searchParams.set(applicationType === "Amendment" ? "amendment" : "renewal", id);
  }

  return {
    subject: `CMS DEMOS: Application Status Changed to ${status}`,
    content: (
      <EmailLayout>
        <Text>Hello,</Text>
        <Text>
          The application status for your Demonstration has been updated in DEMOS. View this
          application and any next steps in the DEMOS system:{" "}
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
          <strong>Date:</strong> {timestamp}
        </Text>
      </EmailLayout>
    ),
  };
}
