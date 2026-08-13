-- Warn in cases where an app document is filtered because it can't be joined to an application

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_app_docs_missing_application') }}
