-- Warn in cases where an in-progress extension is filtered for having no applications

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_apps_pendg_extensions_with_no_applications') }}
