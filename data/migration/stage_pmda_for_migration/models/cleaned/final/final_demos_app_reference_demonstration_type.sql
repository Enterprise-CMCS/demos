SELECT
    final_refs.id AS reference_id,
    ref_demo_types.tag_name_id AS demonstration_type_tag_name_id,
    'Demonstration Type' AS demonstration_type_tag_type_id
FROM
    {{ ref('references_pmda_refs_demo_type_long') }} AS ref_demo_types
LEFT JOIN
    {{ ref('final_demos_app_reference') }} AS final_refs
    ON
        ref_demo_types._internal_reference_id = final_refs._internal_reference_id
