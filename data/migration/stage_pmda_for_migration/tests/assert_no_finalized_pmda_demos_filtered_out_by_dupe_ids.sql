-- Warn in cases where the computed Medicaid ID and CHIP ID are not unique

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_duplicate_demo_nums_in_finalized_pmda_demos') }}
