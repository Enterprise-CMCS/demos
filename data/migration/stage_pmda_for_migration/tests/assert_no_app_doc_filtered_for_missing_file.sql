-- Warn in cases where an app document is filtered because it can't be matched to an actual file

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_app_docs_with_no_matched_file') }}
