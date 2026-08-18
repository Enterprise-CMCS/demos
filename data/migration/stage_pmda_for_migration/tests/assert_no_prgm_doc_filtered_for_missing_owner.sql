-- Warn in cases where a program document is filtered because it can't be joined to an owner

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_prgm_docs_with_no_resolved_owner') }}
