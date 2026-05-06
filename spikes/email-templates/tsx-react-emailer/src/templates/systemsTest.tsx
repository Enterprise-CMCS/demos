import { Text } from "@react-email/components";

import { EmailLayout } from "../emailComponents/EmailLayout.tsx";
import { textStyle } from "../emailComponents/styles.ts";
import { formatDate } from "../formatDate.ts";
import { read } from "../read.ts";
import type { RenderContext, TemplateDefinition } from "../types.ts";

const templateId = "systems-test";

type SystemsTestProps = {
  personGivenName: string;
  userEmail: string;
  currentDate: string;
};

function SystemsTestEmail({ personGivenName, userEmail, currentDate }: SystemsTestProps) {
  return (
    <EmailLayout>
      <Text style={textStyle}>Hello {personGivenName},</Text>
      <Text style={textStyle}>This email template system works.</Text>
      <Text style={textStyle}>This email was sent to {userEmail}</Text>
      <Text style={textStyle}>Thank you,</Text>
      <Text style={textStyle}>DEMOS Notifications</Text>
      <Text style={textStyle}>Action: Systems test</Text>
      <Text style={textStyle}>Current due date: {currentDate}</Text>
    </EmailLayout>
  );
}

export const systemsTestTemplate: TemplateDefinition<SystemsTestProps> = {
  id: templateId,
  subject: "Dear Admin User, Email functionality is nominal",
  Component: SystemsTestEmail,
  getProps(data: unknown, context: RenderContext) {
    return {
      personGivenName: read(data, "person.givenName", templateId),
      userEmail: read(data, "users.email", templateId),
      currentDate: formatDate(context.now),
    };
  },
};
