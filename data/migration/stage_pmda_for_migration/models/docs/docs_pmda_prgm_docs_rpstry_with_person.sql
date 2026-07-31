SELECT
    doc.name,
    doc.description,
    doc.created_at,
    doc.updated_at,
    doc.document_type_id,
    person.id AS owner_user_id,
    doc._legacy_mdcd_demo_pgm_mntrg_doc_id,
    doc._legacy_mdcd_demo_id
FROM {{ ref('docs_pmda_prgm_docs_rpstry_crosswalked_desc') }} AS doc

LEFT JOIN {{ ref('final_demos_app_person') }} AS person
    ON
        doc._legacy_creatd_user_id = person._legacy_users_id
