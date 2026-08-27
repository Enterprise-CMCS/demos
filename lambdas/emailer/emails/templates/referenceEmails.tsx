import { Text } from "@react-email/components";

import { getReferenceTermsEmailData } from "../../referenceTerms";
import { EmailLayout } from "../components/EmailLayout";
import { detailStyle, textStyle } from "../components/styles";
import { getRequiredValue } from "../helpers";
import type { EmailTemplateContext, EmailTemplateResult } from "../types";

export async function renderReferenceTermsEmail(
  _input: unknown,
  context: EmailTemplateContext,
): Promise<EmailTemplateResult> {
  const emailType = "Terms And Conditions Requested";
  const referenceConfigurationId = getRequiredValue(
    context.entityId,
    "entityId",
    emailType,
  );
  const referenceTerms = await getReferenceTermsEmailData(
    referenceConfigurationId,
  );

  return {
    subject: "CMS DEMOS: National Measure Stewards Terms and Conditions",
    content: (
      <EmailLayout>
        <Text style={textStyle}>Hello,</Text>
        <Text style={textStyle}>
          At your request, we are attaching the National Measure Stewards Terms
          and Conditions for {referenceTerms.referenceMaterialName} to which you
          have agreed.
        </Text>
        <Text style={textStyle}>Thank you,</Text>
        <Text style={textStyle}>DEMOS Notifications</Text>
        <Text style={detailStyle}>
          Reference Material File Name: {referenceTerms.referenceMaterialName}
        </Text>
        <Text style={detailStyle}>
          Associated Terms and Conditions: {referenceTerms.referenceAgreementName}
        </Text>
      </EmailLayout>
    ),
    attachments: [referenceTerms.attachment],
  };
}
