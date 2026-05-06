import type { ComponentType } from "react";

export type Recipient = string | {
  name?: string;
  address: string;
};

export type EmailPayload = {
  to: Recipient[];
  subject: string;
  text: string;
  html: string;
};

export type RenderContext = {
  now: Date;
};

export type TemplateDefinition<Props extends object = any> = {
  id: string;
  subject: string | ((props: Props) => string);
  Component: ComponentType<Props>;
  getProps(data: unknown, context: RenderContext): Props;
};
