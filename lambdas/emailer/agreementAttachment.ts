import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { extension as extensionForContentType } from "mime-types";
import type { Attachment } from "nodemailer/lib/mailer";
import { getRequiredObject, getRequiredString } from "./emails/helpers";

const EMAIL_TYPE = "Terms And Conditions Requested";

export async function getAgreementAttachment(rawPayload: unknown): Promise<Attachment> {
  const payload = getRequiredObject(rawPayload, "payload", EMAIL_TYPE);
  const agreement = getRequiredObject(payload.agreement, "agreement", EMAIL_TYPE);
  const key = getRequiredString(agreement.s3Path, "agreement.s3Path", EMAIL_TYPE);
  const name = getRequiredString(agreement.name, "agreement.name", EMAIL_TYPE);
  const bucket = process.env.CLEAN_BUCKET;
  if (!bucket) throw new Error("CLEAN_BUCKET is required to attach the accepted agreement.");

  const endpoint = process.env.AWS_ENDPOINT_URL;
  const client = new S3Client(endpoint ? { endpoint, forcePathStyle: true } : {});
  const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!object.Body) throw new Error(`Accepted agreement S3 object has no body: ${key}`);
  const content = Buffer.from(await object.Body.transformToByteArray());
  if (!content.length) throw new Error(`Accepted agreement S3 object is empty: ${key}`);
  const extension = object.ContentType && extensionForContentType(object.ContentType);
  const filename =
    extension && !name.toLowerCase().endsWith(`.${extension}`) ? `${name}.${extension}` : name;
  return { filename, content, contentType: object.ContentType };
}
