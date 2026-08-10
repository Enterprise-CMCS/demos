import { Link, Text } from "@react-email/components";

import { EmailLayout } from "../components/EmailLayout";
import { detailStyle, textStyle } from "../components/styles";
import type { MultipleDeliverablesEmailProps } from "./types";

export function MultipleDeliverablesEmail({
  demonstrationTitle,
  deliverableNames,
  deliverableType,
  deliverables,
  state
}: MultipleDeliverablesEmailProps) {
  return (
    <EmailLayout>
      <Text style={textStyle}>Hello,</Text>
      <Text style={textStyle}>
        You have been assigned new {deliverableType} deliverables for your Demonstration. View these deliverables and
        any required next steps in the DEMOS system:
      </Text>
      {deliverables.map(({ dueDate, link }) => (
        <Text key={link} style={textStyle}>
          <Link href={link}>{link}</Link> due on {dueDate}
        </Text>
      ))}
      <Text style={textStyle}>Thank you,</Text>
      <Text style={textStyle}>DEMOS Notifications</Text>
      <Text style={detailStyle}>Demonstration: {demonstrationTitle}</Text>
      <Text style={detailStyle}>State: {state}</Text>
      <Text style={detailStyle}>Deliverable type: {deliverableType}</Text>
      <Text style={detailStyle}>Deliverables: {deliverableNames}</Text>
      <Text style={detailStyle}>Action: Multiple Deliverables Created</Text>
    </EmailLayout>
  );
}
