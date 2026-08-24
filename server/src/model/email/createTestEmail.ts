import { EmailAddressResolver } from "graphql-scalars";
import { enqueueEmail } from "../../services/emailQueue";

const TEST_EMAIL_SUBJECT = "CMS DEMOS: Test Email";
const TEST_EMAIL_TEXT =
  "This is a test email confirming that the DEMOS email and SQS system is working.\n\nThank you,\nDEMOS Notifications";

export async function createTestEmail(recipientEmail: string): Promise<string> {
  const normalizedRecipientEmail = recipientEmail.trim();
  try {
    EmailAddressResolver.parseValue(normalizedRecipientEmail);
  } catch {
    throw new Error("A valid recipient email address is required to send a test email.");
  }

  return enqueueEmail({
    to: normalizedRecipientEmail,
    subject: TEST_EMAIL_SUBJECT,
    text: TEST_EMAIL_TEXT,
  });
}
