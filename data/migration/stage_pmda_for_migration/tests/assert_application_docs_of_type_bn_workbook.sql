{{ config(severity='warn') }}

SELECT *
FROM {{ ref('errors_application_docs_of_type_bn_workbook') }}
