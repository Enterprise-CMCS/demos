import { PoolClient } from "pg";
import { DB_SCHEMA } from "../../db";

export const APPLICABLE_APPLICATIONS_QUERY = `
        with all_applications as (
          (select
            demonstration.id,
            demonstration.name,
            demonstration.state_id,
            demonstration.application_type_id,
            null as parent_demonstration_name,
            null as parent_demonstration_id
          from
            ${DB_SCHEMA}.demonstration
          )
          union all 
          (select 
            amendment.id,
            amendment.name,
            demonstration.state_id,
            amendment.application_type_id,
            demonstration.name as parent_demonstration_name,
            demonstration.id as parent_demonstration_id
          from ${DB_SCHEMA}.amendment 
          join ${DB_SCHEMA}.demonstration on 
            demonstration.id = amendment.demonstration_id
          )
          union all 
          (select 
            extension.id,
            extension.name,
            demonstration.state_id,
            extension.application_type_id,
            demonstration.name as parent_demonstration_name,
            demonstration.id as parent_demonstration_id
          from ${DB_SCHEMA}.extension 
          join ${DB_SCHEMA}.demonstration on 
          demonstration.id = extension.demonstration_id
          )
        ),

        application_days_until_expected_approval_date as (
          select 
            id, 
            name, 
            state_id, 
            application_type_id, 
            parent_demonstration_name,
            parent_demonstration_id,
            date_value as expected_approval_date,
            (EXTRACT(EPOCH FROM application_date.date_value) - EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)) / 86400 AS days_until_expected_approval
          from all_applications 
          join ${DB_SCHEMA}.application_date on 
            all_applications.id = application_date.application_id
            and application_date.date_type_id = 'Internal Expected Approval Date'
        )

        select * from application_days_until_expected_approval_date
            WHERE days_until_expected_approval >= 7 AND days_until_expected_approval < 8;
        ;
  `;

type ApplicationExpectedApprovalDateNotification = {
  id: string;
  name: string;
  state_id: string;
  application_type_id: string;
  parent_demonstration_name: string;
  parent_demonstration_id: string | null;
  expected_approval_date: string;
};

export const getApplicationData = async (
  client: PoolClient
): Promise<ApplicationExpectedApprovalDateNotification[]> => {
  const result = await client.query(APPLICABLE_APPLICATIONS_QUERY);
  return result.rows;
};
