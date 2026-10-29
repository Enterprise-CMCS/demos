import { Text } from "@react-email/components";
import type { ReactNode } from "react";

import { EmailLayout as BaseEmailLayout } from "../EmailLayout";
import { detailStyle, textStyle } from "../styles";

export function EmailLayout({
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
    <BaseEmailLayout>
      <Text style={textStyle}>Hello,</Text>
      {message}
      <Text style={textStyle}>Thank you,</Text>
      <Text style={textStyle}>DEMOS Notifications</Text>
      <Text style={detailStyle}>
        <strong>Demonstration:</strong> {demonstrationTitle}
      </Text>
      <Text style={detailStyle}>
        <strong>State:</strong> {state}
      </Text>
      <Text style={detailStyle}>
        <strong>Deliverable type:</strong> {deliverableType}
      </Text>
      <Text style={detailStyle}>
        <strong>Deliverable:</strong> {deliverableName}
      </Text>
      <Text style={detailStyle}>
        <strong>Action:</strong> {action}
      </Text>
      {dateDetails}
    </BaseEmailLayout>
  );
}
