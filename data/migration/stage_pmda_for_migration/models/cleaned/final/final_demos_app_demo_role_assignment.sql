SELECT * FROM {{ ref('cleaned_demos_app_demo_role_prim_po_finalized_demos') }}
<<<<<<< HEAD
=======
UNION ALL
SELECT * FROM {{ ref('cleaned_demos_app_demo_role_prim_po_in_prog_demos') }}
UNION ALL
SELECT * FROM {{ ref('cleaned_demos_app_demo_role_except_primary_pos') }}
>>>>>>> main
