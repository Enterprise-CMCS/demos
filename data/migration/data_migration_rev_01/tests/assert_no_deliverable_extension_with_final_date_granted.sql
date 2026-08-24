-- Warn in cases where a deliverable extension expected to be in progress has a final date granted

{{ config(severity='warn') }}

SELECT * FROM {{ ref('errors_deliverable_extension_with_final_date_granted') }}
