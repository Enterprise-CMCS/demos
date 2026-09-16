-- Warn in cases where an in-progress extension is filtered for having an invalid signature level

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_app_in_prog_extension_invalid_signature_level') }}
