import { randomUUID } from "node:crypto";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import type { Client } from "pg";
import type { GuardDutyScanResultNotificationEvent } from "aws-lambda";

const emailType = "File Upload Failed Virus Scan";
type DatabaseClient = Pick<Client, "query">;

export async function notifyFileScanFailed(
  client: DatabaseClient,
  event: GuardDutyScanResultNotificationEvent
) {
  const queueUrl = process.env.EMAILER_QUEUE_URL;
  if (!queueUrl) throw new Error("EMAILER_QUEUE_URL environment variable is required.");
  const securityOfficerEmail = process.env.SECURITY_OFFICER_EMAIL?.trim().toLowerCase();
  if (!securityOfficerEmail) {
    throw new Error("SECURITY_OFFICER_EMAIL environment variable is required.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(securityOfficerEmail)) {
    throw new Error("SECURITY_OFFICER_EMAIL environment variable must be a valid email address.");
  }
  const schema = process.env.DB_SCHEMA || "demos_app";
  const documentId = event.detail.s3ObjectDetails.objectKey;
  const result = await client.query(
    `SELECT f.name, f.application_id, f.s3_path, p.first_name, p.last_name,
            d.name AS demonstration_name
     FROM ${schema}.document_infected f
     JOIN ${schema}.person p ON p.id = f.owner_user_id
     LEFT JOIN ${schema}.amendment a ON a.id = f.application_id
     LEFT JOIN ${schema}.extension e ON e.id = f.application_id
     JOIN ${schema}.demonstration d ON d.id = COALESCE(a.demonstration_id, e.demonstration_id, f.application_id)
     WHERE f.id = $1`,
    [documentId]
  );
  const file = result.rows[0];
  if (!file)
    throw new Error(
      `Cannot notify scan failure: quarantined document ${documentId} was not found.`
    );
  const adminResult = await client.query(
    `SELECT p.id, p.first_name, p.last_name, p.email FROM ${schema}.person p
     JOIN ${schema}.users u ON u.id = p.id WHERE u.person_type_id = 'demos-admin'`
  );
  const recipients = new Map<string, { personId?: string; name: string; address: string }>([
    [securityOfficerEmail, { name: "Security Official", address: securityOfficerEmail }],
  ]);
  for (const person of adminResult.rows) {
    const address = person.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      throw new Error(
        `Cannot notify scan failure: admin ${person.id} has an invalid email address.`
      );
    }
    recipients.set(address, {
      personId: person.id,
      name: `${person.first_name} ${person.last_name}`.trim(),
      address,
    });
  }
  if (!adminResult.rows.length) {
    throw new Error("Cannot notify scan failure: no DEMOS Admin recipients were found.");
  }
  const bucket = process.env.INFECTED_BUCKET;
  if (!bucket) throw new Error("INFECTED_BUCKET environment variable is required.");
  const quarantineUrl = `https://s3.console.aws.amazon.com/s3/object/${encodeURIComponent(bucket)}?region=${encodeURIComponent(event.region)}&prefix=${encodeURIComponent(file.s3_path)}`;
  const details = event.detail.scanResultDetails;
  const payload = {
    recipients: {
      to: [],
      bcc: Array.from(recipients.values(), ({ name, address }) => ({ name, address })),
    },
    file: {
      id: documentId,
      name: file.name,
      demonstrationName: file.demonstration_name,
      url: `s3://${event.detail.s3ObjectDetails.bucketName}/${documentId}`,
      quarantineUrl,
      detectedAt: event.time,
      virusInformation:
        details.threats?.map((threat) => threat.name).join(", ") || details.scanResultStatus,
      severity: "Not provided by GuardDuty",
      uploadedBy: `${file.first_name} ${file.last_name}`.trim(),
    },
  };
  const notificationId = randomUUID();
  await client.query("BEGIN");
  try {
    await client.query(
      `INSERT INTO ${schema}.email_notification
       (id, email_type_id, entity_type, application_id, status_id, payload, updated_at)
       VALUES ($1, $2, 'application', $3, 'Queued', $4::jsonb, CURRENT_TIMESTAMP)`,
      [notificationId, emailType, file.application_id, JSON.stringify(payload)]
    );
    for (const recipient of recipients.values()) {
      if (!recipient.personId) continue;
      await client.query(
        `INSERT INTO ${schema}.email_notification_recipient (email_notification_id, person_id) VALUES ($1, $2)`,
        [notificationId, recipient.personId]
      );
    }
    const response = await new SQSClient({
      region: process.env.AWS_REGION,
      endpoint: process.env.AWS_ENDPOINT_URL,
    }).send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
          emailNotificationId: notificationId,
          emailType,
          entityType: "application",
          entityId: file.application_id,
          triggeredBy: { type: "guardduty", id: event.id },
          payload,
        }),
      })
    );
    if (!response.MessageId)
      throw new Error(`Failed to queue scan failure email for document ${documentId}.`);
    await client.query(
      `UPDATE ${schema}.email_notification SET sqs_message_id = $2 WHERE id = $1`,
      [notificationId, response.MessageId]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}
