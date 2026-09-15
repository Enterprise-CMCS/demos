SELECT id FROM {{ ref('final_demos_app_application') }}
UNION ALL
SELECT id FROM {{ source('demos_app', 'application') }}
