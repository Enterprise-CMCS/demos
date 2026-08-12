<<<<<<< HEAD
SELECT * FROM {{ ref('cleaned_demos_app_demonstration_finalized_demos') }}
=======
SELECT *
FROM {{ ref('cleaned_demos_app_demonstration_finalized_demos') }}
UNION ALL
SELECT *
FROM {{ ref('cleaned_demos_app_demonstration_in_prog_demos_current_phase') }}
>>>>>>> main
