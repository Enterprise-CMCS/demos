-- Warn in cases where a finalized extension is filtered for having an invalid signature level

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_app_finalized_extension_invalid_signature_level') }}
