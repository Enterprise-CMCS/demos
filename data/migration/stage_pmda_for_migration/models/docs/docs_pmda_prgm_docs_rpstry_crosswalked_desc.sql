SELECT
    trim(doc.orgnl_fil_name) AS name, -- noqa: RF04
    doc_type.description || CASE WHEN doc.arcv_ind = 1 THEN ' (Archived)' ELSE '' END AS description,
    doc.creatd_dt AS created_at,
    doc.creatd_dt AS updated_at,
    'General File' AS document_type_id,
    doc.creatd_user_id AS _legacy_creatd_user_id,
    doc.mdcd_demo_pgm_mntrg_doc_id AS _legacy_mdcd_demo_pgm_mntrg_doc_id,
    doc.mdcd_demo_id AS _legacy_mdcd_demo_id
FROM {{ source('legacy_pmda_raw', 'mdcd_demo_pgm_mntrg_doc') }} AS doc
LEFT JOIN {{ ref('crosswalk_pgm_mntrg_ctgry_type_cd_to_desc') }} AS doc_type
    ON
        doc.pgm_mntrg_ctgry_type_cd = doc_type._legacy_pgm_mntrg_ctgry_type_cd
WHERE doc.dltd_ind = 0
