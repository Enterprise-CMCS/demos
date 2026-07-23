SELECT * FROM {{ ref('cleaned_demos_app_demonstration_finalized_demos') }}
UNION
SELECT * FROM {{ ref('cleaned_demos_app_demonstration_in_prog_demos') }}
