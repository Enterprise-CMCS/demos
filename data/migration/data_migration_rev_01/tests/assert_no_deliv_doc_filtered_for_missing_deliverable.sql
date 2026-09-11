-- Warn in cases where a deliverable document is filtered because it can't be joined to a deliverable

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_deliv_docs_with_no_resolved_deliverable') }}
