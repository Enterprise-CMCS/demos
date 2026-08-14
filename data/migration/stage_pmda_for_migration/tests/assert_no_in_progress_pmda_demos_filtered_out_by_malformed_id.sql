-- Warn in cases where the computed Medicaid ID and CHIP ID appear incorrect for in-progress demos

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_invalid_demo_nums_in_in_prog_pmda_demos') }}
