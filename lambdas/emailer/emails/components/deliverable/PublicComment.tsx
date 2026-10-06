import { Link, Text } from "@react-email/components";

import { EmailLayout } from "../EmailLayout";
import { detailStyle, textStyle } from "../styles";

export function PublicComment({
  demonstrationTitle,
  deliverableName,
  deliverableType,
  link,
  state,
}: {
  demonstrationTitle: string;
  deliverableName: string;
  deliverableType: string;
  link: string;
  state: string;
}) {
  return (
    <EmailLayout>
      <Text style={textStyle}>Hello,</Text>
      <Text style={textStyle}>
        A new comment has been added to a {deliverableType} deliverable. View this deliverable and
        the full comment thread in the DEMOS system: <Link href={link}>{link}</Link>.
      </Text>
      <Text style={textStyle}>Thank you,</Text>
      <Text style={textStyle}>DEMOS Notifications</Text>
      <Text style={detailStyle}>Demonstration: {demonstrationTitle}</Text>
      <Text style={detailStyle}>State: {state}</Text>
      <Text style={detailStyle}>Deliverable: {deliverableName}</Text>
    </EmailLayout>
  );
}
