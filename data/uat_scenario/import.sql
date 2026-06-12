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

create temporary table import_deliverable_action (
	id uuid,
	action_timestamp timestamptz,
	deliverable_id uuid,
	action_type_id text,
	old_status_id text,
	new_status_id text,
	note text,
	active_extension_id uuid,
	due_date_change_allowed boolean,
	should_have_note boolean,
	should_have_user_id boolean,
	extension_id_optional boolean,
	old_due_date timestamptz,
	new_due_date timestamptz,
	user_id uuid,
	user_person_type_id text
) on commit drop;

create temporary table import_target_user (
	owner_kind text,
	user_id uuid,
	person_type_id text
) on commit drop;

create temporary table import_document (
	id uuid,
	name text,
	description text,
	s3_path text,
	owner_user_id uuid,
	owner_person_type_id text,
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

create temporary table import_private_comment (
	id uuid,
	deliverable_id uuid,
	author_user_id uuid,
	author_person_type_id text,
	content text,
	created_at timestamptz,
	updated_at timestamptz
) on commit drop;

create temporary table import_public_comment (
	id uuid,
	deliverable_id uuid,
	author_user_id uuid,
	author_person_type_id text,
	content text,
	created_at timestamptz,
	updated_at timestamptz
) on commit drop;

-- Load direct-copy tables first, and stage the tables whose data must be rewritten
-- for the target environment.
\copy application from 'output/application.csv' with (format csv, header true)
\copy import_demonstration from 'output/demonstration.csv' with (format csv, header true)
\copy import_tag_name from 'output/tag_name.csv' with (format csv, header true)
\copy import_tag from 'output/tag.csv' with (format csv, header true)

\copy import_application_date from 'output/application_date.csv' with (format csv, header true)
\copy application_note from 'output/application_note.csv' with (format csv, header true)
\copy import_application_phase from 'output/application_phase.csv' with (format csv, header true)
\copy application_tag_assignment from 'output/application_tag_assignment.csv' with (format csv, header true)
\copy import_deliverable from 'output/deliverable.csv' with (format csv, header true)
\copy import_deliverable_action from 'output/deliverable_action.csv' with (format csv, header true)
\copy import_document from 'output/document.csv' with (format csv, header true)
\copy import_private_comment from 'output/private_comment.csv' with (format csv, header true)
\copy import_public_comment from 'output/public_comment.csv' with (format csv, header true)

insert into demonstration (id, application_type_id, name, description, effective_date, expiration_date, sdg_division_id, signature_level_id, status_id, current_phase_id, state_id, clearance_level_id, created_at, updated_at)
select id, application_type_id, name, description, effective_date, expiration_date, sdg_division_id, signature_level_id, status_id, current_phase_id, state_id, clearance_level_id, created_at, updated_at
from import_demonstration;

-- Amendment and extension rows depend on demonstration existing first, so load them
-- only after the staged demonstration row has been inserted.
\copy amendment from 'output/amendment.csv' with (format csv, header true)
\copy extension from 'output/extension.csv' with (format csv, header true)

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

-- Resolve the fixed target users that should receive rewritten CMS and state-backed
-- references during import. Fail fast if either username is missing or ambiguous.
DO $$
BEGIN
	IF (select count(*) from users where username = 'DNTestCMSUser') <> 1 THEN
		raise exception 'Expected exactly one target CMS user with username DNTestCMSUser.';
	END IF;

	IF (select count(*) from users where username = 'DavidState') <> 1 THEN
		raise exception 'Expected exactly one target state user with username DavidState.';
	END IF;
END $$;

insert into import_target_user (owner_kind, user_id, person_type_id)
select 'cms', id, person_type_id
from users
where username = 'DNTestCMSUser';

insert into import_target_user (owner_kind, user_id, person_type_id)
select 'state', id, person_type_id
from users
where username = 'DavidState';

-- State-backed document ownership may reference a user that is not yet attached to the
-- imported states. Seed only the fixed state user here; the CMS user is linked to all
-- states by existing trigger behavior.
insert into person_state (person_id, state_id)
select
	import_target_user.user_id,
	imported_states.state_id
from import_target_user
cross join (
	select distinct state_id
	from import_demonstration
) as imported_states
where import_target_user.owner_kind = 'state'
on conflict (person_id, state_id) do nothing;

-- Synthesize a target-side Project Officer for each imported demonstration using the
-- fixed CMS user chosen above. This should fail on conflicts so invalid target state
-- is visible immediately.
insert into demonstration_role_assignment (
	person_id,
	demonstration_id,
	role_id,
	state_id,
	person_type_id,
	grant_level_id
)
select
	target_cms.user_id,
	demonstration.id,
	'Project Officer',
	demonstration.state_id,
	target_cms.person_type_id,
	'Demonstration'
from import_demonstration as demonstration
join import_target_user as target_cms
	on target_cms.owner_kind = 'cms';

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
-- Reassign them to the fixed target CMS user.
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
	target_cms.user_id,
	target_cms.person_type_id,
	import_deliverable.due_date,
	import_deliverable.due_date_type_id,
	import_deliverable.expected_to_be_submitted,
	import_deliverable.created_at,
	import_deliverable.updated_at
from import_deliverable
join import_target_user as target_cms
	on target_cms.owner_kind = 'cms';

\copy deliverable_extension from 'output/deliverable_extension.csv' with (format csv, header true)
\copy deliverable_active_extension from 'output/deliverable_active_extension.csv' with (format csv, header true)
\copy deliverable_demonstration_type from 'output/deliverable_demonstration_type.csv' with (format csv, header true)

-- Deliverable actions can reference environment-specific users. Preserve null user_id
-- values, rewrite CMS/admin actors to the fixed CMS user, and route all other actors
-- to the fixed state user.
insert into deliverable_action (
	id,
	action_timestamp,
	deliverable_id,
	action_type_id,
	old_status_id,
	new_status_id,
	note,
	active_extension_id,
	due_date_change_allowed,
	should_have_note,
	should_have_user_id,
	extension_id_optional,
	old_due_date,
	new_due_date,
	user_id
)
select
	import_deliverable_action.id,
	import_deliverable_action.action_timestamp,
	import_deliverable_action.deliverable_id,
	import_deliverable_action.action_type_id,
	import_deliverable_action.old_status_id,
	import_deliverable_action.new_status_id,
	import_deliverable_action.note,
	import_deliverable_action.active_extension_id,
	import_deliverable_action.due_date_change_allowed,
	import_deliverable_action.should_have_note,
	import_deliverable_action.should_have_user_id,
	import_deliverable_action.extension_id_optional,
	import_deliverable_action.old_due_date,
	import_deliverable_action.new_due_date,
	case
		when import_deliverable_action.user_id is null then null
		else target_owner.user_id
	end
from import_deliverable_action
left join import_target_user as target_owner
	on target_owner.owner_kind = case
		when import_deliverable_action.user_person_type_id in ('demos-admin', 'demos-cms-user') then 'cms'
		else 'state'
	end;

-- Documents also carry environment-specific ownership. Route source CMS/admin owners
-- to the fixed target CMS user and all other owners to the fixed target state user.
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
	target_owner.user_id,
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
join import_target_user as target_owner
	on target_owner.owner_kind = case
		when import_document.owner_person_type_id in ('demos-admin', 'demos-cms-user') then 'cms'
		else 'state'
	end;

\copy budget_neutrality_workbook from 'output/budget_neutrality_workbook.csv' with (format csv, header true)

-- Private comments also encode author person type, so rewrite both author columns to
-- the fixed target CMS/state users.
insert into private_comment (
	id,
	deliverable_id,
	author_user_id,
	author_person_type_id,
	content,
	created_at,
	updated_at
)
select
	import_private_comment.id,
	import_private_comment.deliverable_id,
	target_owner.user_id,
	target_owner.person_type_id,
	import_private_comment.content,
	import_private_comment.created_at,
	import_private_comment.updated_at
from import_private_comment
join import_target_user as target_owner
	on target_owner.owner_kind = case
		when import_private_comment.author_person_type_id in ('demos-admin', 'demos-cms-user') then 'cms'
		else 'state'
	end;

-- Public comments only store author_user_id in the live table, so use the exported
-- source author type to choose the fixed target CMS/state user.
insert into public_comment (
	id,
	deliverable_id,
	author_user_id,
	content,
	created_at,
	updated_at
)
select
	import_public_comment.id,
	import_public_comment.deliverable_id,
	target_owner.user_id,
	import_public_comment.content,
	import_public_comment.created_at,
	import_public_comment.updated_at
from import_public_comment
join import_target_user as target_owner
	on target_owner.owner_kind = case
		when import_public_comment.author_person_type_id in ('demos-admin', 'demos-cms-user') then 'cms'
		else 'state'
	end;

COMMIT;