SELECT * FROM {{ ref('cleaned_demos_app_app_phases_finalized_demos') }}
UNION
SELECT * FROM {{ ref('cleaned_demos_app_app_phases_in_prog_demos') }}
