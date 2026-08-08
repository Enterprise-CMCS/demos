-- Warn in cases where a program document is filtered because it can't be matched to an actual file

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_prgm_docs_with_no_matched_file') }}
