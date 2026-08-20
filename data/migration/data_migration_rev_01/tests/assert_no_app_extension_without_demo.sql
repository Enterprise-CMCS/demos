-- Warn in cases where an extension is filtered not not having a demo

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_app_extension_without_demo') }}
