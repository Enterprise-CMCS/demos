-- Warn in cases where the computed Medicaid ID and CHIP ID appear incorrect

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_demos_with_invalid_medicaid_chip_id_numbers') }}
