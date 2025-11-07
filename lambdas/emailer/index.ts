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

  if (!isValidEmailData(email)) {
    return;
  }

  // Since the email data is being passed directly to nodemailer from SQS, this
  // will remove any potential nodemailer keys that we aren't explicitly
  // allowing
  email = stripDisallowedFields(email)

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

let allowList: string[];

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
