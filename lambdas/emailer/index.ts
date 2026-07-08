import nodemailer from "nodemailer";
import { SQSEvent } from "aws-lambda";

import * as ssm from "@aws-sdk/client-ssm";

import { log } from "./log";
import { Address, Options } from "nodemailer/lib/mailer";

type EmailerAddress = string | Address | Array<string | Address>;

export interface EmailData extends Pick<Options, "html" | "cc" | "bcc"> {
  to: EmailerAddress;
  subject: string;
  text: string;
}

export const REALTIME_EMAIL_TYPES = [
  "Deliverable Created",
  "Deliverable Submitted",
  "Deliverable Due Date Updated",
  "Extension Requested",
  "Extension Decision Made",
  "Resubmission Requested",
  "Deliverable Accepted",
  "Deliverable Approved",
  "Deliverable Received and Filed",
  "Public Comment Added",
  "Terms And Conditions Requested",
  "Application Status Updated",
] as const;

export type RealtimeEmailType = (typeof REALTIME_EMAIL_TYPES)[number];

type RealtimeEmailEnvelope = {
  emailType: RealtimeEmailType;
  template: string;
  entityType: string;
  entityId: string;
  triggeredBy: {
    type: string;
    id: string;
  };
  triggeredAt: string;
  idempotencyKey: string;
  payload: {
    to: EmailerAddress;
    id: string;
    name?: string;
    deliverableType?: string;
    dueDate?: string;
    status?: string;
    demonstration?: {
      id: string;
      name: string;
      state: {
        id: string;
      };
    };
  };
};

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

  let parsedBody;
  try {
    parsedBody = JSON.parse(record.body);
  } catch (err) {
    log.info({ error: (err as Error).message }, "unable to parse SQS message body");
    return;
  }

  const coercedEmail = coerceEmailData(parsedBody);
  if (!coercedEmail) {
    return;
  }

  if (!isValidEmailData(coercedEmail)) {
    return;
  }

  // Since the email data is being passed directly to nodemailer from SQS, this
  // will remove any potential nodemailer keys that we aren't explicitly
  // allowing
  const email = stripDisallowedFields(coercedEmail)

  let info;
  try {
    const emailData = {
      ...email,
      from: process.env.EMAIL_FROM,
    };

    if (process.env.DISABLE_EMAIL_ALLOWLIST == "true" || (await sendEmailIsAllowed(email.to))) {
      info = await transporter.sendMail(emailData);
    } else {
      emailData.to = redactEmailAddresses(emailData.to);
      log.info({ emailData }, "log only: email not in allowlist");
      info = { messageId: "log-only" };
    }
  } catch (err) {
    log.error({ error: (err as Error).message }, "unable to send email:");
    throw err;
  }

  log.info({ messageId: info.messageId, email: redactEmailAddresses(email.to) }, "message sent");

  return "success";
};

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

  return true;
}

export function coerceEmailData(input: unknown): EmailData | null {
  if (!input || typeof input !== "object") {
    log.info("unsupported email payload type");
    return null;
  }

  const maybeEnvelope = input as Partial<RealtimeEmailEnvelope>;
  if (maybeEnvelope.emailType && maybeEnvelope.payload) {
    return renderRealtimeEmail(maybeEnvelope as RealtimeEmailEnvelope);
  }

  return input as EmailData;
}

export function renderRealtimeEmail(envelope: RealtimeEmailEnvelope): EmailData | null {
  if (!REALTIME_EMAIL_TYPES.includes(envelope.emailType)) {
    log.info({ emailType: envelope.emailType }, "unsupported realtime email type");
    return null;
  }

  const to = envelope.payload?.to;
  if (!to) {
    log.info("realtime email payload requires a 'to' field");
    return null;
  }

  const id = envelope.payload.id || envelope.entityId;
  const name = envelope.payload.name ?? "Deliverable";
  const demonstrationName = envelope.payload.demonstration?.name;
  const stateId = envelope.payload.demonstration?.state?.id;
  const type = envelope.payload.deliverableType;
  const dueDate = envelope.payload.dueDate;

  const actionTextByType: Record<RealtimeEmailType, string> = {
    "Deliverable Created": "Deliverable Created",
    "Deliverable Submitted": "Deliverable Submitted",
    "Deliverable Due Date Updated": "Deliverable Due Date Updated",
    "Extension Requested": "Extension Requested",
    "Extension Decision Made": "Extension Decision Made",
    "Resubmission Requested": "Resubmission Requested",
    "Deliverable Accepted": "Deliverable Accepted",
    "Deliverable Approved": "Deliverable Approved",
    "Deliverable Received and Filed": "Deliverable Received and Filed",
    "Public Comment Added": "Public Comment Added",
    "Terms And Conditions Requested": "Terms And Conditions Requested",
    "Application Status Updated": "Application Status Updated",
  };

  const actionText = actionTextByType[envelope.emailType];

  const subject = `CMS DEMOS Deliverable: ${actionText}`;
  const lines = [
    "Hello,",
    "",
    `${actionText} for ${name}.`,
    `View this item in DEMOS: https://demos.example.gov/deliverables/${id}`,
  ];

  if (demonstrationName) {
    lines.push("", `Demonstration: ${demonstrationName}`);
  }
  if (stateId) {
    lines.push(`State: ${stateId}`);
  }
  if (type) {
    lines.push(`Deliverable type: ${type}`);
  }
  if (dueDate) {
    lines.push(`Due date: ${dueDate}`);
  }

  lines.push("", "Thank you,", "", "DEMOS Notifications");

  const text = lines.join("\n");

  const html = [
    `<p>Hello,</p>`,
    `<p>${actionText} for ${name}.</p>`,
    `<p>View this item in DEMOS: <a href=\"https://demos.example.gov/deliverables/${id}\">https://demos.example.gov/deliverables/${id}</a></p>`,
    demonstrationName ? `<p>Demonstration: ${demonstrationName}</p>` : "",
    stateId ? `<p>State: ${stateId}</p>` : "",
    type ? `<p>Deliverable type: ${type}</p>` : "",
    dueDate ? `<p>Due date: ${dueDate}</p>` : "",
    `<p>Thank you,</p>`,
    `<p>DEMOS Notifications</p>`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    to,
    subject,
    text,
    html,
  };
}

// Not real validation, just making sure its a valid format
export function isEmailerAddress(address?: EmailerAddress): address is EmailerAddress {
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

export async function sendEmailIsAllowed(emails: EmailerAddress): Promise<boolean> {
  const al = await getAllowList();

  const standardizedEmails = [];
  if (Array.isArray(emails)) {
    for (const e of emails) {
      if (typeof e == "string") {
        standardizedEmails.push(e);
      } else {
        standardizedEmails.push(e.address);
      }
    }
  } else if (typeof emails == "string") {
    standardizedEmails.push(emails);
  } else {
    standardizedEmails.push(emails.address);
  }

  return standardizedEmails.every((e) => al.includes(e));
}

export function clearCache() {
  allowList = undefined
}

export async function getAllowList() {
  if (allowList) {
    return allowList;
  }

  const client = new ssm.SSMClient({
    region: process.env.AWS_REGION ?? "us-east-1",
    endpoint: process.env.AWS_ENDPOINT_URL ?? undefined,
  });

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

export function redactEmailAddresses(addresses: EmailerAddress): typeof addresses {
  if (Array.isArray(addresses)) {
    return addresses.map((e) => redactEmailAddress(e));
  }

  return redactEmailAddress(addresses);
}

function redactEmailAddress(address: string | Address): typeof address {
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

export function stripDisallowedFields(data: EmailData): EmailData {
  const {html,cc,bcc,to,subject,text, ...rest} = data
  if (Object.keys(rest).length > 0) {
    log.warn({strippedFields: rest}, "invalid fields passed to the emailer")
  }

  return {html,cc,bcc,to,subject,text}
}
