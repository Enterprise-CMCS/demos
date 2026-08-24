import { EmailAddressResolver } from "graphql-scalars";
import { enqueueEmail } from "../../services/emailQueue";

const TEST_EMAIL_SUBJECT = "CMS DEMOS: Test Email";
const TEST_EMAIL_TEXT =
  "This is a test email confirming that the DEMOS email and SQS system is working.\n\nThank you,\nDEMOS Notifications";
const TEST_EMAIL_DOMAINS = ["icf.com", "globalalliantinc.com", "t1cg.com", "cms.hhs.gov"];

function verifyAdminEmail(email: string): void {
  const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase();
  if (!TEST_EMAIL_DOMAINS.includes(domain)) {
    throw new Error();
  }
}

export async function createTestEmail(recipientEmail: string): Promise<string> {
  const normalizedRecipientEmail = recipientEmail.trim();
  try {
    EmailAddressResolver.parseValue(normalizedRecipientEmail);
    verifyAdminEmail(normalizedRecipientEmail);
  } catch {
    throw new Error("A valid recipient email address is required to send a test email.");
  }

  return enqueueEmail({
    to: normalizedRecipientEmail,
    subject: TEST_EMAIL_SUBJECT,
    text: TEST_EMAIL_TEXT,
  });
}
