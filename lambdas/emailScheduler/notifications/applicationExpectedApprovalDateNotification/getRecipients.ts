import { PoolClient } from "pg";
import { DB_SCHEMA } from "../../db";

export const EMAIL_RECIPIENTS_QUERY = `
  WITH application_demonstration AS (
        SELECT
          application.id AS application_id,
          COALESCE(demonstration.id, parent.id) AS demonstration_id
        FROM ${DB_SCHEMA}.application
        LEFT JOIN ${DB_SCHEMA}.demonstration ON demonstration.id = application.id
        LEFT JOIN ${DB_SCHEMA}.amendment ON amendment.id = application.id
        LEFT JOIN ${DB_SCHEMA}.extension ON extension.id = application.id
        LEFT JOIN ${DB_SCHEMA}.demonstration AS parent
          ON parent.id = COALESCE(amendment.demonstration_id, extension.demonstration_id)
      )
      SELECT DISTINCT
        person.id AS person_id,
        person.first_name,
        person.last_name,
        person.email
      from application_demonstration 
      join ${DB_SCHEMA}.demonstration_role_assignment on 
    	application_demonstration.demonstration_id = demonstration_role_assignment.demonstration_id  
      join ${DB_SCHEMA}.person on 
	    demonstration_role_assignment.person_id = person.id
	    and person.person_type_id in ('demos-admin', 'demos-cms-user','demos-restricted-cms-user')
	  where application_demonstration.application_id = $1
      ;
    `;

export type Recipient = {
  person_id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export const getRecipients = async (
  client: PoolClient,
  applicationId: string
): Promise<Recipient[]> => {
  const result = await client.query(EMAIL_RECIPIENTS_QUERY, [applicationId]);
  return result.rows;
};
