SELECT
    demo.id AS application_id,
    doc.name,
    doc.description,
    doc.created_at,
    doc.updated_at,
    doc.document_type_id,
    doc.owner_user_id,
    doc._legacy_creatd_user_id,
    doc._legacy_mdcd_demo_pgm_mntrg_doc_id,
    doc._legacy_mdcd_demo_id,
    doc._legacy_upldd_fil_name,
    s3_files.pmda_s3_file_id
FROM
    {{ ref('docs_pmda_prgm_docs_rpstry_with_person') }} AS doc

LEFT JOIN {{ ref('cleaned_demos_app_demonstration_finalized_demos') }} AS demo
    ON
        doc._legacy_mdcd_demo_id = demo._legacy_mdcd_demo_id

LEFT JOIN
    {{ ref('docs_pmda_s3_file_list') }} AS s3_files
    ON
        doc._legacy_upldd_fil_name = s3_files.file_name
        AND doc._legacy_mdcd_demo_id = s3_files.extracted_mdcd_demo_id
        AND s3_files.pmda_s3_doc_source_type = 'program_monitoring'
