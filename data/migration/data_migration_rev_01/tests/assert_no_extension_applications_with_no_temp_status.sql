-- Warn in cases where a finalized extension's temp status could not be determined

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_extension_applications_with_no_temp_status') }}
