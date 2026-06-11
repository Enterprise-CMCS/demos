\set ON_ERROR_STOP on

\if :{?db_schema}
\else
\echo 'Pass db_schema with -v db_schema=<schema> when running this script.'
\quit 1
\endif

\! test -d output

BEGIN;

select pg_catalog.set_config('search_path', :'db_schema', false);

-- Stage rows that either need target-side transformation or controlled conflict handling
-- before they can be inserted into live tables.
create temporary table import_application_date (
	application_id uuid,
	date_type_id text,
	date_value timestamptz,
	created_at timestamptz,
	updated_at timestamptz
) on commit drop;

create temporary table import_application_phase (
	application_id uuid,
	phase_id text,
	phase_status_id text,
	created_at timestamptz,
	updated_at timestamptz
) on commit drop;

create temporary table import_demonstration (
	id uuid,
	application_type_id text,
	name text,
	description text,
	effective_date timestamptz,
	expiration_date timestamptz,
	sdg_division_id text,
	signature_level_id text,
	status_id text,
	current_phase_id text,
	state_id text,
	clearance_level_id text,
	created_at timestamptz,
	updated_at timestamptz
) on commit drop;

create temporary table import_tag_name (
	id text,
	created_at timestamptz,
	updated_at timestamptz
) on commit drop;

create temporary table import_tag (
	tag_name_id text,
	tag_type_id text,
	source_id text,
	status_id text,
	created_at timestamptz,
	updated_at timestamptz
) on commit drop;

create temporary table import_deliverable (
	id uuid,
	deliverable_type_id text,
	name text,
	demonstration_id uuid,
	demonstration_status_id text,
	status_id text,
	cms_owner_user_id uuid,
	cms_owner_person_type_id text,
	due_date timestamptz,
	due_date_type_id text,
	expected_to_be_submitted boolean,
	created_at timestamptz,
	updated_at timestamptz
) on commit drop;

create temporary table import_document (
	id uuid,
	name text,
	description text,
	s3_path text,
	owner_user_id uuid,
	document_type_id text,
	application_id uuid,
	phase_id text,
	deliverable_id uuid,
	deliverable_type_id text,
	deliverable_is_cms_attached_file boolean,
	deliverable_submission_action_id uuid,
	deliverable_submission_action_type_id text,
	created_at timestamptz,
	updated_at timestamptz
) on commit drop;

-- Load direct-copy tables first, and stage the tables whose data must be rewritten
-- for the target environment.
\copy application from 'output/application.csv' with (format csv, header true)
\copy import_demonstration from 'output/demonstration.csv' with (format csv, header true)
\copy amendment from 'output/amendment.csv' with (format csv, header true)
\copy extension from 'output/extension.csv' with (format csv, header true)
\copy import_tag_name from 'output/tag_name.csv' with (format csv, header true)
\copy import_tag from 'output/tag.csv' with (format csv, header true)

\copy import_application_date from 'output/application_date.csv' with (format csv, header true)
\copy application_note from 'output/application_note.csv' with (format csv, header true)
\copy import_application_phase from 'output/application_phase.csv' with (format csv, header true)
\copy application_tag_assignment from 'output/application_tag_assignment.csv' with (format csv, header true)
\copy import_deliverable from 'output/deliverable.csv' with (format csv, header true)
\copy import_document from 'output/document.csv' with (format csv, header true)

insert into demonstration (id, application_type_id, name, description, effective_date, expiration_date, sdg_division_id, signature_level_id, status_id, current_phase_id, state_id, clearance_level_id, created_at, updated_at)
select id, application_type_id, name, description, effective_date, expiration_date, sdg_division_id, signature_level_id, status_id, current_phase_id, state_id, clearance_level_id, created_at, updated_at
from import_demonstration;

-- These two tables are populated by application-side trigger behavior, so a strict insert
-- would fail even for a valid clone. Upsert here is intentional.
insert into application_date (application_id, date_type_id, date_value, created_at, updated_at)
select application_id, date_type_id, date_value, created_at, updated_at
from import_application_date
on conflict (application_id, date_type_id) do update
set
	date_value = excluded.date_value,
	created_at = excluded.created_at,
	updated_at = excluded.updated_at;

insert into application_phase (application_id, phase_id, phase_status_id, created_at, updated_at)
select application_id, phase_id, phase_status_id, created_at, updated_at
from import_application_phase
on conflict (application_id, phase_id) do update
set
	phase_status_id = excluded.phase_status_id,
	created_at = excluded.created_at,
	updated_at = excluded.updated_at;

-- tag_name and tag are global reference data. If the target already has the same row,
-- keep the existing record and continue.
insert into tag_name (id, created_at, updated_at)
select id, created_at, updated_at
from import_tag_name
on conflict (id) do nothing;

insert into tag (tag_name_id, tag_type_id, source_id, status_id, created_at, updated_at)
select tag_name_id, tag_type_id, source_id, status_id, created_at, updated_at
from import_tag
on conflict (tag_name_id, tag_type_id) do nothing;

-- Role assignments cannot be copied from the source environment because they depend on
-- target users. Fail early if no valid local CMS/admin user exists for a demo's state.
DO $$
BEGIN
	IF EXISTS (
		select 1
		from import_demonstration as demonstration
		where not exists (
			select 1
			from users
			join person_state
				on person_state.person_id = users.id
				and person_state.state_id = demonstration.state_id
			where users.person_type_id in ('demos-cms-user', 'demos-admin')
		)
	) THEN
		raise exception 'No valid Project Officer candidate exists in the target database for at least one imported demonstration state.';
	END IF;
END $$;

-- Synthesize a target-side Project Officer for each imported demonstration.
-- This should fail on conflicts so invalid target state is visible immediately.
insert into demonstration_role_assignment (
	person_id,
	demonstration_id,
	role_id,
	state_id,
	person_type_id,
	grant_level_id
)
select
	project_officer.person_id,
	demonstration.id,
	'Project Officer',
	demonstration.state_id,
	project_officer.person_type_id,
	'Demonstration'
from import_demonstration as demonstration
cross join lateral (
	select
		users.id as person_id,
		users.person_type_id
	from users
	join person_state
		on person_state.person_id = users.id
		and person_state.state_id = demonstration.state_id
	where users.person_type_id in ('demos-cms-user', 'demos-admin')
	order by
		case users.person_type_id when 'demos-cms-user' then 0 else 1 end,
		users.id
	limit 1
) as project_officer;

-- Mirror the generated assignment into the primary role table.
insert into primary_demonstration_role_assignment (
	person_id,
	demonstration_id,
	role_id
)
select
	demonstration_role_assignment.person_id,
	demonstration_role_assignment.demonstration_id,
	demonstration_role_assignment.role_id
from demonstration_role_assignment
join import_demonstration
	on import_demonstration.id = demonstration_role_assignment.demonstration_id
where demonstration_role_assignment.role_id = 'Project Officer'
;

\copy demonstration_type_tag_assignment from 'output/demonstration_type_tag_assignment.csv' with (format csv, header true)

-- Deliverables carry a source cms owner that is not valid in the target environment.
-- Reassign them to the generated local Project Officer for the cloned demonstration.
insert into deliverable (
	id,
	deliverable_type_id,
	name,
	demonstration_id,
	demonstration_status_id,
	status_id,
	cms_owner_user_id,
	cms_owner_person_type_id,
	due_date,
	due_date_type_id,
	expected_to_be_submitted,
	created_at,
	updated_at
)
select
	import_deliverable.id,
	import_deliverable.deliverable_type_id,
	import_deliverable.name,
	import_deliverable.demonstration_id,
	import_deliverable.demonstration_status_id,
	import_deliverable.status_id,
	primary_demonstration_role_assignment.person_id,
	demonstration_role_assignment.person_type_id,
	import_deliverable.due_date,
	import_deliverable.due_date_type_id,
	import_deliverable.expected_to_be_submitted,
	import_deliverable.created_at,
	import_deliverable.updated_at
from import_deliverable
join primary_demonstration_role_assignment
	on primary_demonstration_role_assignment.demonstration_id = import_deliverable.demonstration_id
	and primary_demonstration_role_assignment.role_id = 'Project Officer'
join demonstration_role_assignment
	on demonstration_role_assignment.person_id = primary_demonstration_role_assignment.person_id
	and demonstration_role_assignment.demonstration_id = primary_demonstration_role_assignment.demonstration_id
	and demonstration_role_assignment.role_id = primary_demonstration_role_assignment.role_id;

\copy deliverable_extension from 'output/deliverable_extension.csv' with (format csv, header true)
\copy deliverable_active_extension from 'output/deliverable_active_extension.csv' with (format csv, header true)
\copy deliverable_action from 'output/deliverable_action.csv' with (format csv, header true)
\copy deliverable_demonstration_type from 'output/deliverable_demonstration_type.csv' with (format csv, header true)

-- Documents also carry environment-specific ownership, so they are rewritten to the
-- same generated local Project Officer.
insert into document (
	id,
	name,
	description,
	s3_path,
	owner_user_id,
	document_type_id,
	application_id,
	phase_id,
	deliverable_id,
	deliverable_type_id,
	deliverable_is_cms_attached_file,
	deliverable_submission_action_id,
	deliverable_submission_action_type_id,
	created_at,
	updated_at
)
select
	import_document.id,
	import_document.name,
	import_document.description,
	import_document.s3_path,
	primary_demonstration_role_assignment.person_id,
	import_document.document_type_id,
	import_document.application_id,
	import_document.phase_id,
	import_document.deliverable_id,
	import_document.deliverable_type_id,
	import_document.deliverable_is_cms_attached_file,
	import_document.deliverable_submission_action_id,
	import_document.deliverable_submission_action_type_id,
	import_document.created_at,
	import_document.updated_at
from import_document
join primary_demonstration_role_assignment
	on primary_demonstration_role_assignment.demonstration_id = import_document.application_id
	and primary_demonstration_role_assignment.role_id = 'Project Officer';

\copy budget_neutrality_workbook from 'output/budget_neutrality_workbook.csv' with (format csv, header true)
\copy private_comment from 'output/private_comment.csv' with (format csv, header true)
\copy public_comment from 'output/public_comment.csv' with (format csv, header true)

COMMIT;