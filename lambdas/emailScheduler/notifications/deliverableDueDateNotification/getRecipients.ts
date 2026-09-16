import { PoolClient } from "pg";
import { DB_SCHEMA } from "../../db";

const emailRecipientsQuery = `
      WITH recipient_ids AS (
        SELECT
          roles.person_id AS id
        FROM ${DB_SCHEMA}.deliverable AS deliverable
        JOIN ${DB_SCHEMA}.demonstration_role_assignment AS roles
          ON roles.demonstration_id = deliverable.demonstration_id
        WHERE deliverable.id = $1
        UNION
        SELECT
          deliverable.cms_owner_user_id AS id
        FROM ${DB_SCHEMA}.deliverable AS deliverable
        WHERE deliverable.id = $1
      )
      SELECT
        person.id AS person_id,
        person.first_name,
        person.last_name,
        person.email
      FROM ${DB_SCHEMA}.person AS person
      JOIN recipient_ids
        ON person.id = recipient_ids.id;
    `;

export type Recipient = {
  person_id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export const getRecipients = async (
  client: PoolClient,
  deliverableId: string
): Promise<Recipient[]> => {
  const result = await client.query(emailRecipientsQuery, [deliverableId]);
  return result.rows;
};
