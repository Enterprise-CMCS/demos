import { Text } from "@react-email/components";
import type { ReactNode } from "react";

import { EmailLayout } from "./EmailLayout";
import { detailStyle, textStyle } from "./styles";

export function DeliverableEmailLayout({
  action,
  dateDetails,
  demonstrationTitle,
  deliverableName,
  deliverableType,
  message,
  state,
}: {
  action: string;
  dateDetails: ReactNode;
  demonstrationTitle: string;
  deliverableName: string;
  deliverableType: string;
  message: ReactNode;
  state: string;
}) {
  return (
    <EmailLayout>
      <Text style={textStyle}>Hello,</Text>
      {message}
      <Text style={textStyle}>Thank you,</Text>
      <Text style={textStyle}>DEMOS Notifications</Text>
      <Text style={detailStyle}>Demonstration: {demonstrationTitle}</Text>
      <Text style={detailStyle}>State: {state}</Text>
      <Text style={detailStyle}>Deliverable type: {deliverableType}</Text>
      <Text style={detailStyle}>Deliverable: {deliverableName}</Text>
      <Text style={detailStyle}>Action: {action}</Text>
      {dateDetails}
    </EmailLayout>
  );
}
