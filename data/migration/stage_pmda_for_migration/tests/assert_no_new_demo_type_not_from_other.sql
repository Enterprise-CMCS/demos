SELECT * FROM {{ ref('error_new_demo_type_in_prog_not_from_other') }}
UNION ALL
SELECT * FROM {{ ref('error_new_demo_type_finalized_not_from_other') }}
