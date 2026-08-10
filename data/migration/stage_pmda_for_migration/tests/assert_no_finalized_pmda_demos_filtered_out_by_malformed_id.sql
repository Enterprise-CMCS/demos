-- Warn in cases where the computed Medicaid ID and CHIP ID appear incorrect for finalized demos

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_invalid_demo_nums_in_finalized_pmda_demos') }}
