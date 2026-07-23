import { Text } from "@react-email/components";
import type { ReactNode } from "react";

import { EmailLayout } from "../components/EmailLayout";
import { detailStyle, textStyle } from "../components/styles";
import type { DeliverableEmailProps } from "./types";

type Props = DeliverableEmailProps & {
  action: string;
  children: ReactNode;
};

export function DeliverableEmail({
  action,
  children,
  currentDueDate,
  demonstrationTitle,
  deliverableName,
  deliverableType,
  state,
}: Props) {
  return (
    <EmailLayout>
      <Text style={textStyle}>Hello,</Text>
      {children}
      <Text style={textStyle}>Thank you,</Text>
      <Text style={textStyle}>DEMOS Notifications</Text>
      <Text style={detailStyle}>Demonstration: {demonstrationTitle}</Text>
      <Text style={detailStyle}>State: {state}</Text>
      <Text style={detailStyle}>Deliverable type: {deliverableType}</Text>
      <Text style={detailStyle}>Deliverable: {deliverableName}</Text>
      <Text style={detailStyle}>Action: {action}</Text>
      <Text style={detailStyle}>Current due date: {currentDueDate}</Text>
    </EmailLayout>
  );
}
