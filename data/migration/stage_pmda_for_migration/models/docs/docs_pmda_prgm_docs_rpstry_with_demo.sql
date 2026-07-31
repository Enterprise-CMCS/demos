SELECT
    demo.id AS application_id,
    doc.name,
    doc.description,
    doc.created_at,
    doc.updated_at,
    doc.document_type_id,
    doc.owner_user_id,
    doc._legacy_mdcd_demo_pgm_mntrg_doc_id
FROM {{ ref('docs_pmda_prgm_docs_rpstry_with_person') }} AS doc

LEFT JOIN {{ ref('cleaned_demos_app_demonstration_finalized_demos') }} AS demo
    ON
        doc._legacy_mdcd_demo_id = demo._legacy_mdcd_demo_id
