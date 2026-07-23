SELECT * FROM {{ ref('cleaned_demos_app_demo_role_prim_po_finalized_demos') }}
UNION
SELECT * FROM {{ ref('cleaned_demos_app_demo_role_prim_po_in_prog_demos') }}
