import type { ReactElement } from "react";
import type { Options } from "nodemailer/lib/mailer";

export type EmailRecipient =
  | string
  | {
      name?: string;
      address: string;
    };

export type EmailRecipientGroups = {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
};

export type RenderedEmailPayload = EmailRecipientGroups & {
  subject: string;
  text: string;
  html: string;
  attachments?: NonNullable<Options["attachments"]>;
};

export type EmailTemplateResult = {
  subject: string;
  content: ReactElement;
  attachments?: NonNullable<Options["attachments"]>;
};

export type EmailTemplateContext = {
  entityId?: string;
};

export type EmailTemplate = (
  input: unknown,
  context: EmailTemplateContext,
) => EmailTemplateResult | Promise<EmailTemplateResult>;
