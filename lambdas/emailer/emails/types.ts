import type { ReactElement } from "react";

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
};

export type EmailTemplateResult = {
  subject: string;
  content: ReactElement;
};

export type EmailTemplate = (
  input: unknown,
) => EmailTemplateResult | Promise<EmailTemplateResult>;
