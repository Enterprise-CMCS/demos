import { PoolClient } from "pg";
import { DB_SCHEMA } from "../../db";

export const EMAIL_RECIPIENTS_QUERY_STATE_USER = `
      SELECT DISTINCT
        person.id AS person_id,
        person.first_name,
        person.last_name,
        person.email
      FROM ${DB_SCHEMA}.person AS person
      JOIN ${DB_SCHEMA}.demonstration_role_assignment AS roles
        ON person.id = roles.person_id
      where roles.demonstration_id = $1
        and person.person_type_id = 'demos-state-user';
    `;

export const EMAIL_RECIPIENTS_QUERY_NON_STATE_USER = `
      SELECT DISTINCT
        person.id AS person_id,
        person.first_name,
        person.last_name,
        person.email
      FROM ${DB_SCHEMA}.person AS person
      JOIN ${DB_SCHEMA}.demonstration_role_assignment AS roles
        ON person.id = roles.person_id
      where roles.demonstration_id = $1
        and person.person_type_id != 'demos-state-user';
    `;

export type Recipient = {
  person_id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export const getRecipients = async (
  client: PoolClient,
  demonstrationId: string,
  isStateUser: boolean
): Promise<Recipient[]> => {
  const result = await (isStateUser
    ? client.query(EMAIL_RECIPIENTS_QUERY_STATE_USER, [demonstrationId])
    : client.query(EMAIL_RECIPIENTS_QUERY_NON_STATE_USER, [demonstrationId]));
  return result.rows;
};
