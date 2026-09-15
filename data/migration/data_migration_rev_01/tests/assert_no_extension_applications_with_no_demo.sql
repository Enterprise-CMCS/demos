-- Warn in cases where an extension application is filtered for having no demo

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_extension_applications_with_no_demo') }}
