import { getDbPool, getDbSchema } from "./db";

export type DeliveryStatus = "Sent" | "Failed";

export async function updateEmailNotificationStatus(
  emailNotificationId: string,
  status: DeliveryStatus,
  lastError: string | null = null
): Promise<void> {
  const pool = await getDbPool();
  const schema = getDbSchema();
  const result = await pool.query(
    `UPDATE ${schema}.email_notification
     SET status_id = $2, last_error = $3, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1::UUID
     RETURNING id`,
    [emailNotificationId, status, lastError]
  );

  if (result.rowCount !== 1) {
    throw new Error(`Email notification not found: ${emailNotificationId}`);
  }
}
