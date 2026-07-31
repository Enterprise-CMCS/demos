SELECT * FROM {{ ref('cleaned_demos_app_deliverable_docs') }}
UNION ALL
SELECT * FROM {{ ref('cleaned_demos_app_application_docs') }}
