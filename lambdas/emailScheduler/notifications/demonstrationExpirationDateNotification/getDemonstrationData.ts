import { PoolClient } from "pg";
import { DB_SCHEMA } from "../../db";

export const REMINDER_STAGES = [
  "Thirty Days Prior",
  "Sixty Days Prior",
  "Ninety Days Prior",
] as const;

export type ReminderStage = (typeof REMINDER_STAGES)[number];

export const APPLICABLE_DEMONSTRATIONS_QUERY = `
    WITH demonstration_days_until_due AS (
      SELECT
        demonstration.id,
        demonstration.name,
        state.name AS state_name,
        demonstration.expiration_date,
        (EXTRACT(EPOCH FROM demonstration.expiration_date) - EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)) / 86400
          AS days_until_due
      FROM ${DB_SCHEMA}.demonstration AS demonstration
      JOIN ${DB_SCHEMA}.state AS state
        ON state.id = demonstration.state_id
    )
    SELECT id, name, state_name, expiration_date
    FROM demonstration_days_until_due
    WHERE days_until_due >= $1 AND days_until_due < $1 + 1;
  `;

export type DemonstrationExpirationDateNotification = {
  id: string;
  name: string;
  state_name: string;
  expiration_date: string;
};

export const getDemonstrationData = async (
  client: PoolClient,
  reminderStage: ReminderStage
): Promise<DemonstrationExpirationDateNotification[]> => {
  let daysBeforeDueDate: number;

  switch (reminderStage) {
    case "Thirty Days Prior":
      daysBeforeDueDate = 30;
      break;
    case "Sixty Days Prior":
      daysBeforeDueDate = 60;
      break;
    case "Ninety Days Prior":
      daysBeforeDueDate = 90;
      break;
    default:
      throw new Error(`Unrecognized reminderStage: ${reminderStage}`);
  }

  const result = await client.query(APPLICABLE_DEMONSTRATIONS_QUERY, [daysBeforeDueDate]);
  return result.rows;
};
