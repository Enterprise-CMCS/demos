import type { ComponentType } from "react";

export type EmailRecipient =
  | string
  | {
      name?: string;
      address: string;
    };

export type RenderedEmailPayload = {
  to: EmailRecipient[];
  subject: string;
  text: string;
  html: string;
};

export type EmailRenderContext = {
  now: Date;
};

export type EmailTemplateDefinition<Props extends object = any, Input = any> = {
  id: string;
  subject: string | ((props: Props) => string);
  Component: ComponentType<Props>;
  getProps(input: Input, context: EmailRenderContext): Props;
  getRecipients(input: Input): EmailRecipient[];
};
