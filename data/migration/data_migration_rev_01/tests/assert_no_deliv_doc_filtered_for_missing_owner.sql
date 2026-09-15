-- Warn in cases where a deliverable document is filtered because it can't be joined to an owner

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_deliv_docs_with_no_resolved_owner') }}
