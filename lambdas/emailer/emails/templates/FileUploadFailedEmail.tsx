import { Link, Text } from "@react-email/components";

import { EmailLayout } from "../components/EmailLayout";
import { getRequiredObject, getRequiredString } from "../helpers";
import type { EmailTemplate } from "../types";

export const renderFileUploadFailedEmail: EmailTemplate = (rawPayload) => {
  const emailType = "File Upload Failed Virus Scan";
  const payload = getRequiredObject(rawPayload, "payload", emailType);
  const file = getRequiredObject(payload.file, "file", emailType);
  const field = (key: string) => getRequiredString(file[key], `file.${key}`, emailType);
  const fileUrl = field("url");
  const quarantineUrl = field("quarantineUrl");

  return {
    subject: "CMS DEMOS: File Upload Failed",
    content: (
      <EmailLayout>
        <Text>Hello,</Text>
        <Text>
          A file upload to DEMOS could not be completed because the file failed virus scan.
        </Text>
        <Text>Demonstration: {field("demonstrationName")}</Text>
        <Text>File Name: {field("name")}</Text>
        <Text>File URL: <Link href={fileUrl}>{fileUrl}</Link></Text>
        <Text>Timestamp when detected: {field("detectedAt")}</Text>
        <Text>Information on the virus: {field("virusInformation")}</Text>
        <Text>Severity: {field("severity")}</Text>
        <Text>Quarantined File: <Link href={quarantineUrl}>{quarantineUrl}</Link></Text>
        <Text>User Information: {field("uploadedBy")}</Text>
        <Text>Source of File - User upload</Text>
        <Text>Thank you,</Text>
        <Text>DEMOS Notifications</Text>
      </EmailLayout>
    ),
  };
};
