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
    SELECT
      deliverable.id,
      deliverable.deliverable_type_id,
      deliverable.name,
      demonstration.name AS demonstration_name,
      demonstration.state_id AS state_id,
      deliverable.due_date AS due_date,
      deliverable.status_id AS status_id
    FROM ${DB_SCHEMA}.deliverable AS deliverable
    JOIN ${DB_SCHEMA}.demonstration AS demonstration
      ON deliverable.demonstration_id = demonstration.id
    WHERE CURRENT_TIMESTAMP < deliverable.due_date - ($1 * INTERVAL '1 day')
      AND CURRENT_TIMESTAMP >= deliverable.due_date - ($1 * INTERVAL '1 day') - INTERVAL '1 day'
      AND deliverable.status_id IN ('Upcoming', 'Past Due');
  `;

type DeliverableDueDateNotification = {
  id: string;
  deliverable_type_id: string;
  name: string;
  demonstration_name: string;
  state_id: string;
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
