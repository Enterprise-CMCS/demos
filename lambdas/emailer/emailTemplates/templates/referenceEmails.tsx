import { Text } from "@react-email/components";

import { buildReferenceTermsAttachment } from "../../emailAttachments";
import { EmailLayout } from "../components/EmailLayout";
import { detailStyle, textStyle } from "../components/styles";
import { getRequiredValue } from "../EmailHelper";
import type { EmailTemplateResult } from "../types";

type ReferenceTermsInput = {
  referenceMaterial?: {
    name?: string;
  };
  termsAndConditions?: {
    name?: string;
  };
};

export async function renderReferenceTermsEmail(
  input: unknown,
): Promise<EmailTemplateResult> {
  const payload =
    input && typeof input === "object" ? (input as ReferenceTermsInput) : {};
  const emailType = "Terms And Conditions Requested";
  const referenceMaterialName = getRequiredValue(
    payload.referenceMaterial?.name,
    "referenceMaterial.name",
    emailType,
  );
  const termsAndConditionsName = getRequiredValue(
    payload.termsAndConditions?.name,
    "termsAndConditions.name",
    emailType,
  );

  return {
    subject: "CMS DEMOS: National Measure Stewards Terms and Conditions",
    content: (
      <EmailLayout>
        <Text style={textStyle}>Hello,</Text>
        <Text style={textStyle}>
          At your request, we are attaching the National Measure Stewards Terms
          and Conditions for {referenceMaterialName} to which you have agreed.
        </Text>
        <Text style={textStyle}>Thank you,</Text>
        <Text style={textStyle}>DEMOS Notifications</Text>
        <Text style={detailStyle}>
          Reference Material File Name: {referenceMaterialName}
        </Text>
        <Text style={detailStyle}>
          Associated Terms and Conditions: {termsAndConditionsName}
        </Text>
      </EmailLayout>
    ),
    attachments: [await buildReferenceTermsAttachment(input)],
  };
}
