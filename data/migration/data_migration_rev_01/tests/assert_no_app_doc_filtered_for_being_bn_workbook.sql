-- Warn in cases where an app document is filtered because it is a BN workbook
-- Strictly speaking this is acceptable, but want to make sure it is noted

{{ config(severity='warn') }}

SELECT *
FROM {{ ref('errors_app_docs_of_type_bn_workbook') }}
