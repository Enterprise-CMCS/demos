import { Text } from "@react-email/components";

import { EmailLayout } from "../components/EmailLayout";
import { detailStyle, textStyle } from "../components/styles";
import { getRequiredValue } from "../EmailHelper";
import type { EmailRecipientGroups, EmailTemplateDefinition } from "../types";

type ReferenceTermsInput = {
  recipients?: EmailRecipientGroups;
  referenceMaterial?: {
    name?: string;
  };
  termsAndConditions?: {
    name?: string;
  };
};

type ReferenceTermsProps = {
  referenceMaterialName: string;
  termsAndConditionsName: string;
};

function ReferenceTermsEmail({
  referenceMaterialName,
  termsAndConditionsName,
}: ReferenceTermsProps) {
  return (
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
  );
}

export const referenceEmailTemplates: Record<string, EmailTemplateDefinition> =
  {
    "Terms And Conditions Requested": {
      subject: "CMS DEMOS: National Measure Stewards Terms and Conditions",
      Component: ReferenceTermsEmail,
      getProps(input: ReferenceTermsInput) {
        return {
          referenceMaterialName: getRequiredValue(
            input.referenceMaterial?.name,
            "referenceMaterial.name",
            "Terms And Conditions Requested",
          ),
          termsAndConditionsName: getRequiredValue(
            input.termsAndConditions?.name,
            "termsAndConditions.name",
            "Terms And Conditions Requested",
          ),
        };
      },
      getRecipients(input: ReferenceTermsInput) {
        return getRequiredValue(
          input.recipients,
          "recipients",
          "Terms And Conditions Requested",
        );
      },
    },
  };
