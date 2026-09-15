import { Text } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";
import { getRequiredObject, getRequiredString } from "../helpers";
import type { EmailTemplateResult } from "../types";

const EMAIL_TYPE = "Terms And Conditions Requested";

export function renderTermsAndConditionsRequestedEmail(rawPayload: unknown): EmailTemplateResult {
  const payload = getRequiredObject(rawPayload, "payload", EMAIL_TYPE);
  const reference = getRequiredObject(payload.reference, "reference", EMAIL_TYPE);
  const agreement = getRequiredObject(payload.agreement, "agreement", EMAIL_TYPE);
  const referenceName = getRequiredString(reference.name, "reference.name", EMAIL_TYPE);
  const agreementName = getRequiredString(agreement.name, "agreement.name", EMAIL_TYPE);

  return {
    subject: "CMS DEMOS: National Measure Stewards Terms and Conditions",
    content: (
      <EmailLayout>
        <Text>Hello,</Text>
        <Text>
          At your request, we are attaching the National Measure Stewards Terms and Conditions for{" "}
          {referenceName} to which you have agreed.
        </Text>
        <Text>
          Thank you,
          <br />
          DEMOS Notifications
        </Text>
        <Text>
          <strong>Reference Material File Name:</strong> {referenceName}
        </Text>
        <Text>
          <strong>Associated Terms and Conditions:</strong> {agreementName}
        </Text>
      </EmailLayout>
    ),
  };
}
