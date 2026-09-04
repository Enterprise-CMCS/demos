-- Warn in cases where a deliverable extension did not have an original date requested deliverable

{{ config(severity='warn') }}

SELECT * FROM {{ ref('errors_deliverable_extension_with_no_original_date_requested') }}
