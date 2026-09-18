import { PoolClient } from "pg";
import { DB_SCHEMA } from "../../db";

export const REMINDER_STAGES = [
  "Five Days Prior",
  "Due Today",
  "Five Days After",
  "Ten Days After",
] as const;

export type ReminderStage = (typeof REMINDER_STAGES)[number];

export const APPLICABLE_DELIVERABLES_QUERY = `
    WITH deliverable_days_until_due AS (
      SELECT
        deliverable.id,
        deliverable.deliverable_type_id,
        deliverable.name,
        demonstration.name AS demonstration_name,
        state.name AS state_name,
        deliverable.due_date AS due_date,
        deliverable.status_id AS status_id,
        cast(deliverable.due_date AT TIME ZONE 'America/New_York' AS DATE) 
          - cast(current_timestamp AT TIME ZONE 'America/New_York' AS DATE) 
        as days_until_due
      FROM ${DB_SCHEMA}.deliverable AS deliverable
      JOIN ${DB_SCHEMA}.demonstration AS demonstration
        ON deliverable.demonstration_id = demonstration.id
      JOIN ${DB_SCHEMA}.state AS state
        ON state.id = demonstration.state_id
      WHERE deliverable.status_id IN ('Upcoming', 'Past Due')
    )
    SELECT id, deliverable_type_id, name, demonstration_name, state_name, due_date, status_id
    FROM deliverable_days_until_due
    WHERE days_until_due = $1;
  `;

type DeliverableDueDateNotification = {
  id: string;
  deliverable_type_id: string;
  name: string;
  demonstration_name: string;
  state_name: string;
  due_date: string;
  status_id: string;
};

export const getDeliverableData = async (
  client: PoolClient,
  reminderStage: ReminderStage
): Promise<DeliverableDueDateNotification[]> => {
  let daysBeforeDueDate: number;

  switch (reminderStage) {
    case "Five Days Prior":
      daysBeforeDueDate = 5;
      break;
    case "Due Today":
      daysBeforeDueDate = 0;
      break;
    case "Five Days After":
      daysBeforeDueDate = -5;
      break;
    case "Ten Days After":
      daysBeforeDueDate = -10;
      break;
    default:
      throw new Error(`Unrecognized reminderStage: ${reminderStage}`);
  }

  const result = await client.query(APPLICABLE_DELIVERABLES_QUERY, [daysBeforeDueDate]);
  return result.rows;
};
