SELECT * FROM {{ ref('final_demos_app_application') }}
UNION ALL
SELECT * FROM {{ source('legacy_pmda_staged', 'final_demos_app_application') }}
