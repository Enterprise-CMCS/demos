-- Warn in cases where a deliverable extension could not be associated with a deliverable

{{ config(severity='warn') }}

SELECT * FROM {{ ref('errors_deliverable_extension_with_no_deliverable') }}
