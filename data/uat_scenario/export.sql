\set ON_ERROR_STOP on

\if :{?demonstration_id}
\else
\echo 'Pass demonstration_id with -v demonstration_id=<uuid> when running this script.'
\quit 1
\endif

\if :{?db_schema}
\else
\echo 'Pass db_schema with -v db_schema=<schema> when running this script.'
\quit 1
\endif

\! mkdir -p output

select pg_catalog.set_config('search_path', :'db_schema', false);

-- Run this file with psql so each query is exported to a CSV in output/.
-- The goal is to export one self-contained demonstration slice that can later be
-- remapped and imported into another environment.

-- Export the core application graph first: the demonstration's application row,
-- related amendments/extensions, and the child tables attached to those applications.
COPY (
select * from amendment where demonstration_id = :'demonstration_id'
) TO STDOUT WITH (format csv, header true)
\g output/amendment.csv

COPY (
select * from application where id in (select id from demonstration where id = :'demonstration_id' union select id from amendment where demonstration_id = :'demonstration_id'
union select id from extension where demonstration_id = :'demonstration_id')
) TO STDOUT WITH (format csv, header true)
\g output/application.csv

COPY (
select * from application_date where application_id in (select id from demonstration where id = :'demonstration_id' union select id from amendment where demonstration_id = :'demonstration_id'
union select id from extension where demonstration_id = :'demonstration_id')
) TO STDOUT WITH (format csv, header true)
\g output/application_date.csv

COPY (
select * from application_note where application_id in (select id from demonstration where id = :'demonstration_id' union select id from amendment where demonstration_id = :'demonstration_id'
union select id from extension where demonstration_id = :'demonstration_id')
) TO STDOUT WITH (format csv, header true)
\g output/application_note.csv

COPY (
select * from application_phase where application_id in (select id from demonstration where id = :'demonstration_id' union select id from amendment where demonstration_id = :'demonstration_id'
union select id from extension where demonstration_id = :'demonstration_id')
) TO STDOUT WITH (format csv, header true)
\g output/application_phase.csv

COPY (
select * from budget_neutrality_workbook where id in (select id from document where application_id in (select id from demonstration where id = :'demonstration_id' union select id from amendment where demonstration_id = :'demonstration_id'
union select id from extension where demonstration_id = :'demonstration_id'))
) TO STDOUT WITH (format csv, header true)
\g output/budget_neutrality_workbook.csv

-- Export deliverables and their dependent rows. These rows stay in the clone, but
-- some ownership fields will be rewritten during import for the target environment.
COPY (
select * from deliverable where demonstration_id = :'demonstration_id'
) TO STDOUT WITH (format csv, header true)
\g output/deliverable.csv

COPY (
select * from deliverable_action where deliverable_id in (select id from deliverable where demonstration_id = :'demonstration_id')
) TO STDOUT WITH (format csv, header true)
\g output/deliverable_action.csv

COPY (
select * from deliverable_active_extension where deliverable_active_extension.deliverable_id in (select id from deliverable where demonstration_id = :'demonstration_id')
) TO STDOUT WITH (format csv, header true)
\g output/deliverable_active_extension.csv

COPY (
select * from deliverable_extension where deliverable_extension.deliverable_id in (select id from deliverable where demonstration_id = :'demonstration_id')
) TO STDOUT WITH (format csv, header true)
\g output/deliverable_extension.csv

COPY (
select
	id,
	application_type_id,
	name,
	description,
	effective_date,
	expiration_date,
	sdg_division_id,
	signature_level_id,
	status_id,
	current_phase_id,
	state_id,
	clearance_level_id,
	created_at,
	updated_at
from demonstration where id = :'demonstration_id'
) TO STDOUT WITH (format csv, header true)
\g output/demonstration.csv

-- Export demonstration-level tag assignments and application-level tag assignments.
-- The tag/tag_name reference rows are exported separately below so those assignments
-- can be imported without missing global lookup data.
COPY (
select * from demonstration_type_tag_assignment where demonstration_id = :'demonstration_id'
) TO STDOUT WITH (format csv, header true)
\g output/demonstration_type_tag_assignment.csv

-- Export documents for the demonstration application graph. The document records are
-- preserved, but owner_user_id will be rewritten during import.
COPY (
select * from document where application_id in (select id from demonstration where id = :'demonstration_id'
union select id from amendment where demonstration_id = :'demonstration_id'
union select id from extension where demonstration_id = :'demonstration_id'
)
) TO STDOUT WITH (format csv, header true)
\g output/document.csv

COPY (
select * from extension where demonstration_id = :'demonstration_id'
) TO STDOUT WITH (format csv, header true)
\g output/extension.csv

COPY (
select * from private_comment where private_comment.deliverable_id in (select id from deliverable where demonstration_id = :'demonstration_id')
) TO STDOUT WITH (format csv, header true)
\g output/private_comment.csv

COPY (
select * from public_comment where public_comment.deliverable_id in (select id from deliverable where demonstration_id = :'demonstration_id')
) TO STDOUT WITH (format csv, header true)
\g output/public_comment.csv

COPY (
select * from application_tag_assignment where application_id in (select id from demonstration where id = :'demonstration_id'
union select id from amendment where demonstration_id = :'demonstration_id'
union select id from extension where demonstration_id = :'demonstration_id'
)
) TO STDOUT WITH (format csv, header true)
\g output/application_tag_assignment.csv

-- Export the global tag lookup rows referenced by the tag assignments in this slice.
-- These are imported with conflict handling because they may already exist in the target.
COPY (
select * from tag where tag.tag_name_id in (
select demonstration_type_tag_assignment.tag_name_id from demonstration_type_tag_assignment where demonstration_id = :'demonstration_id'
union
select application_tag_assignment.tag_name_id from application_tag_assignment where application_id in (
select id from demonstration where id = :'demonstration_id'
union select id from amendment where demonstration_id = :'demonstration_id'
union select id from extension where demonstration_id = :'demonstration_id'
)
)
) TO STDOUT WITH (format csv, header true)
\g output/tag.csv

COPY (
select * from tag_name where tag_name.id in (
select tag.tag_name_id from tag where tag.tag_name_id in (
select demonstration_type_tag_assignment.tag_name_id from demonstration_type_tag_assignment where demonstration_id = :'demonstration_id'
union
select application_tag_assignment.tag_name_id from application_tag_assignment where application_id in (
select id from demonstration where id = :'demonstration_id'
union select id from amendment where demonstration_id = :'demonstration_id'
union select id from extension where demonstration_id = :'demonstration_id'
)
)
)
) TO STDOUT WITH (format csv, header true)
\g output/tag_name.csv

-- Export the remaining deliverable and demonstration associations after their parent rows.
COPY (
select * from deliverable_demonstration_type where deliverable_demonstration_type.deliverable_id in (select id from deliverable where demonstration_id = :'demonstration_id')
) TO STDOUT WITH (format csv, header true)
\g output/deliverable_demonstration_type.csv

-- These role-assignment tables are exported for completeness and traceability, but the
-- import script intentionally synthesizes target-side equivalents instead of copying the
-- source user assignments directly.
COPY (
select * from demonstration_role_assignment where demonstration_id = :'demonstration_id'
) TO STDOUT WITH (format csv, header true)
\g output/demonstration_role_assignment.csv

COPY (
select * from primary_demonstration_role_assignment where demonstration_id = :'demonstration_id'
) TO STDOUT WITH (format csv, header true)
\g output/primary_demonstration_role_assignment.csv
