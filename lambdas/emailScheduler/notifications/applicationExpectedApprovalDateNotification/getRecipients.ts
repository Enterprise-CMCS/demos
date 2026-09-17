import { PoolClient } from "pg";
import { DB_SCHEMA } from "../../db";

export const EMAIL_RECIPIENTS_QUERY = `
  WITH parent_demonstration AS (
        (SELECT demonstration.id as application_id, demonstration.id AS demonstration_id
         FROM ${DB_SCHEMA}.demonstration)
        UNION ALL
        (SELECT amendment.id as application_id, amendment.demonstration_id
         FROM ${DB_SCHEMA}.amendment)
        UNION ALL
        (SELECT extension.id as application_id, extension.demonstration_id
         FROM ${DB_SCHEMA}.extension)
      )
      SELECT DISTINCT
        person.id AS person_id,
        person.first_name,
        person.last_name,
        person.email
      from parent_demonstration 
      join ${DB_SCHEMA}.demonstration_role_assignment on 
    	parent_demonstration.demonstration_id = demonstration_role_assignment.demonstration_id  
      join ${DB_SCHEMA}.person on 
	    demonstration_role_assignment.person_id = person.id
	    and person.person_type_id in ('demos-admin', 'demos-cms-user','demos-restricted-cms-user')
	  where parent_demonstration.application_id = $1
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
