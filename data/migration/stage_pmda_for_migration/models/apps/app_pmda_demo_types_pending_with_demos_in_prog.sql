SELECT
    in_prog_demos.id AS demonstration_id,
    demo_types.tag_name_id,
    demo_types.tag_type_id,
    demo_types.effective_date,
    demo_types.expiration_date,
    demo_types.created_at,
    demo_types.updated_at,
    demo_types._legacy_mdcd_pendg_demo_id,
    demo_types._is_other
FROM {{ ref('app_pmda_demo_types_pending') }} AS demo_types
LEFT JOIN
    {{ ref('cleaned_demos_app_demonstration_in_prog_demos_current_phase') }} AS in_prog_demos
    ON
        demo_types._legacy_mdcd_pendg_demo_id = in_prog_demos._legacy_mdcd_pendg_demo_id
