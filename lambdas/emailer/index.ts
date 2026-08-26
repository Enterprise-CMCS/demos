import nodemailer from "nodemailer";
import { SQSEvent } from "aws-lambda";

import * as ssm from "@aws-sdk/client-ssm";

import { log } from "./log";
import { Address, Options } from "nodemailer/lib/mailer";
import { renderEmail } from "./emailTemplates/renderEmail";
import {
  DeliveryStatus,
  updateEmailNotificationStatus,
} from "./emailNotificationStatus";

type EmailerAddress = string | Address;
type EmailerAddressGroup = EmailerAddress | EmailerAddress[];

type RealtimeEmailEnvelope = {
  emailNotificationId?: string;
  emailType: string;
  entityType?: string;
  entityId?: string;
  idempotencyKey?: string;
  triggeredBy?: {
    type: string;
    id: string;
  };
  payload: unknown;
};

export interface EmailData extends Pick<Options, "html" | "cc" | "bcc" | "attachments"> {
  to: EmailerAddressGroup;
  subject: string;
  text: string;
}

export const handler = async (event: SQSEvent) => {
  if (event.Records.length == 0) {
    log.warn("empty sqs message received");
    return;
  }

  if (event.Records.length > 1) {
    log.warn("multiple events received, only the first will be processed");
  }

  const record = event.Records[0];

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number.parseInt(process.env.EMAIL_PORT ?? "587"),
  });

  let email;
  try {
    email = JSON.parse(record.body);
  } catch (err) {
    log.info({ error: (err as Error).message }, "unable to parse SQS message body");
    return;
  }

  const emailLogContext = isRealtimeEmailEnvelope(email)
    ? {
        emailType: email.emailType,
        entityType: email.entityType,
        entityId: email.entityId,
        idempotencyKey: email.idempotencyKey,
        triggeredBy: email.triggeredBy,
      }
      : {};
  const realtimeEmail = isRealtimeEmailEnvelope(email) ? email : undefined;

  try {
    email = await renderRealtimeEmailIfNeeded(email);
  } catch (err) {
    await recordDeliveryStatus(realtimeEmail, "Failed", getErrorMessage(err));
    log.error({ error: (err as Error).message }, "unable to render realtime email");
    throw err;
  }

  if (!isValidEmailData(email)) {
    if (realtimeEmail?.emailNotificationId) {
      const error = new Error(
        `Tracked realtime email did not render valid email data: ${realtimeEmail.emailNotificationId}`
      );
      await recordDeliveryStatus(realtimeEmail, "Failed", error.message);
      throw error;
    }
    return;
  }

  let info;
  try {
    const emailData = {
      to: email.to,
      subject: email.subject,
      text: email.text,
      ...(email.html !== undefined ? { html: email.html } : {}),
      ...(email.cc !== undefined ? { cc: email.cc } : {}),
      ...(email.bcc !== undefined ? { bcc: email.bcc } : {}),
      ...(realtimeEmail && email.attachments !== undefined
        ? { attachments: email.attachments }
        : {}),
      from: process.env.EMAIL_FROM,
    };

    const emailIsAllowed =
      process.env.DISABLE_EMAIL_ALLOWLIST == "true" ||
      (await sendEmailIsAllowed(email.to, email.cc, email.bcc));

    if (!emailIsAllowed) {
      log.info(
        {
          ...emailLogContext,
          subject: emailData.subject,
          recipients: redactEmailRecipients(emailData),
        },
        "log only: email not in allowlist"
      );
      await recordDeliveryStatus(
        realtimeEmail,
        "Failed",
        "Email blocked by recipient allowlist."
      );
      return "success";
    }

    info = await transporter.sendMail(emailData);
  } catch (err) {
    await recordDeliveryStatus(realtimeEmail, "Failed", getErrorMessage(err));
    log.error({ error: (err as Error).message }, "unable to send email:");
    throw err;
  }

  await recordDeliveryStatus(realtimeEmail, "Sent");

  log.info(
    {
      ...emailLogContext,
      messageId: info.messageId,
      recipients: redactEmailRecipients(email),
    },
    "message sent"
  );

  return "success";
};

async function recordDeliveryStatus(
  email: RealtimeEmailEnvelope | undefined,
  status: DeliveryStatus,
  lastError: string | null = null
): Promise<void> {
  if (!email?.emailNotificationId) {
    return;
  }

  try {
    await updateEmailNotificationStatus(email.emailNotificationId, status, lastError);
  } catch (error) {
    log.error(
      {
        error: getErrorMessage(error),
        emailNotificationId: email.emailNotificationId,
        status,
      },
      "unable to update email notification delivery status"
    );
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function renderRealtimeEmailIfNeeded(email: unknown): Promise<unknown> {
  if (!isRealtimeEmailEnvelope(email)) {
    return email;
  }

  log.info(
    {
      emailType: email.emailType,
      entityId: email.entityId,
    },
    "rendering realtime email template"
  );

  return renderEmail(email.emailType, email.payload);
}

export function isValidEmailData(email: any): email is EmailData {
  if (!isEmailerAddress(email.to)) {
    log.info("an email must have a valid 'to' property");
    return false;
  }

  if (typeof email.subject != "string") {
    log.info("an email must have a 'subject' property");
    return false;
  }

  if (typeof email.text != "string") {
    log.info("an email must have a 'text' property");
    return false;
  }

  if (email.cc !== undefined && !isEmailerAddress(email.cc)) {
    log.info("an email must have a valid 'cc' property");
    return false;
  }

  if (email.bcc !== undefined && !isEmailerAddress(email.bcc)) {
    log.info("an email must have a valid 'bcc' property");
    return false;
  }

  return true;
}

export function isRealtimeEmailEnvelope(email: unknown): email is RealtimeEmailEnvelope {
  return (
    typeof email === "object" &&
    email !== null &&
    typeof (email as RealtimeEmailEnvelope).emailType === "string" &&
    "payload" in email
  );
}

// Not real validation, just making sure its a valid format
export function isEmailerAddress(
  address?: EmailerAddressGroup
): address is EmailerAddressGroup {
  if (!address) {
    return false;
  }

  if (typeof address == "string") {
    return true;
  }

  if (!Array.isArray(address) && typeof address.address == "string") {
    return true;
  }

  if (Array.isArray(address) && address.every((v) => isEmailerAddress(v))) {
    return true;
  }

  return false;
}

let allowList: string[] | undefined;

export async function sendEmailIsAllowed(
  ...recipientGroups: Array<EmailerAddressGroup | undefined>
): Promise<boolean> {
  const allowList = await getAllowList();
  const recipients = recipientGroups.flatMap((group) =>
    group === undefined ? [] : Array.isArray(group) ? group : [group]
  );

  return recipients.every((recipient) =>
    allowList.includes(typeof recipient == "string" ? recipient : recipient.address)
  );
}

export function clearCache() {
  allowList = undefined
}

export async function getAllowList() {
  if (allowList) {
    return allowList;
  }

  const client = new ssm.SSMClient({});

  const getAllowListParam = new ssm.GetParameterCommand({
    Name: process.env.ALLOW_LIST_PARAM_NAME,
  });

  try {
    const resp = await client.send(getAllowListParam);
    if (!resp.Parameter?.Value) {
      throw new Error("unable to retrieve allowlist or value is empty");
    }

    const emails = JSON.parse(resp.Parameter.Value);
    if (!Array.isArray(emails)) {
      log.error({ value: emails, raw: resp.Parameter.Value }, "allow list is not an array");
      allowList = [];
      return allowList;
    }

    allowList = [...emails];
    return allowList;
  } catch (err) {
    log.error({ error: (err as Error).message }, "error requesting ssm parameter");
    throw err;
  }
}

export function redactEmailAddresses(
  addresses: EmailerAddressGroup
): typeof addresses {
  if (Array.isArray(addresses)) {
    return addresses.map((e) => redactEmailAddress(e));
  }

  return redactEmailAddress(addresses);
}

function redactEmailRecipients(email: Pick<EmailData, "to" | "cc" | "bcc">) {
  return {
    to: redactEmailAddresses(email.to),
    cc: email.cc ? redactEmailAddresses(email.cc) : undefined,
    bcc: email.bcc ? redactEmailAddresses(email.bcc) : undefined,
  };
}

function redactEmailAddress(address: EmailerAddress): typeof address {
  const e = typeof address == "string" ? address : address.address;

  const [local, domain] = e.split("@");
  if (!domain) return address;

  const visible = local.slice(0, 2);

  const redactedEmail = `${visible}****@${domain}`;

  if (typeof address == "string") {
    return redactedEmail;
  }

  return { ...address, address: redactedEmail } as Address;
}
