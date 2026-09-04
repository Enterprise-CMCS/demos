SELECT id
FROM {{ ref('final_demos_app_users') }}
UNION ALL
SELECT id FROM {{ source('demos_app', 'users') }}
