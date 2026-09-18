import { PoolClient } from "pg";
import { DB_SCHEMA } from "../../db";

export const APPLICABLE_APPLICATIONS_QUERY = `
        with all_applications as (
          select
            application.id,
            application.application_type_id,
            coalesce(demonstration.name, amendment.name, extension.name) as name,
            state.name as state_name,
            parent.name as parent_demonstration_name,
            parent.id as parent_demonstration_id,
            application_date.date_value as expected_approval_date,
            cast(application_date.date_value AT TIME ZONE 'America/New_York' AS DATE) 
              - cast(current_timestamp AT TIME ZONE 'America/New_York' AS DATE) 
            as days_until_expected_approval
          from ${DB_SCHEMA}.application
          left join ${DB_SCHEMA}.demonstration on demonstration.id = application.id
          left join ${DB_SCHEMA}.amendment on amendment.id = application.id
          left join ${DB_SCHEMA}.extension on extension.id = application.id
          left join ${DB_SCHEMA}.demonstration as parent
            on parent.id = coalesce(amendment.demonstration_id, extension.demonstration_id)
          join ${DB_SCHEMA}.state
            on state.id = coalesce(demonstration.state_id, parent.state_id)
          join ${DB_SCHEMA}.application_date
            on application_date.application_id = application.id
            and application_date.date_type_id = 'Internal Expected Approval Date'
        )

        select id, name, state_name, application_type_id, parent_demonstration_name, parent_demonstration_id, expected_approval_date
        from all_applications
            WHERE days_until_expected_approval = 7
        ;
  `;

type ApplicationExpectedApprovalDateNotification = {
  id: string;
  name: string;
  state_name: string;
  application_type_id: string;
  parent_demonstration_name: string | null;
  parent_demonstration_id: string | null;
  expected_approval_date: string;
};

export const getApplicationData = async (
  client: PoolClient
): Promise<ApplicationExpectedApprovalDateNotification[]> => {
  const result = await client.query(APPLICABLE_APPLICATIONS_QUERY);
  return result.rows;
};
