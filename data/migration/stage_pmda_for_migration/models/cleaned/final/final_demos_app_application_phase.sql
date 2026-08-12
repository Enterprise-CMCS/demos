SELECT * FROM {{ ref('cleaned_demos_app_app_phases_finalized_demos') }}
<<<<<<< HEAD
=======
UNION ALL
SELECT * FROM {{ ref('cleaned_demos_app_app_phases_in_prog_demos') }}
>>>>>>> main
