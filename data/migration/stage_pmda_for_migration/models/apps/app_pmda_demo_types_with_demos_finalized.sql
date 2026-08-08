SELECT
    finalized_demos.id AS demonstration_id,
    demo_types.tag_name_id,
    demo_types.tag_type_id,
    demo_types.effective_date,
    demo_types.expiration_date,
    demo_types.created_at,
    demo_types.updated_at,
    demo_types._legacy_mdcd_demo_id,
    demo_types._is_other
FROM {{ ref('app_pmda_demo_types') }} AS demo_types
LEFT JOIN
    {{ ref('cleaned_demos_app_demonstration_finalized_demos') }} AS finalized_demos
    ON
        demo_types._legacy_mdcd_demo_id = finalized_demos._legacy_mdcd_demo_id
