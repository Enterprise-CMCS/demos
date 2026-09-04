-- Warn in cases where a deliverable extension's reason code could not be determined

{{ config(severity='warn') }}

SELECT * FROM {{ ref('errors_deliverable_extension_with_no_reason_code') }}
