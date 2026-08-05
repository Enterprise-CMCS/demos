SELECT
    final_docs.id AS final_document_id,
    final_docs.s3_path AS final_document_s3_path,
    final_docs._internal_pmda_s3_file_id,
    s3_files.s3_prefix_and_file_name AS legacy_pmda_s3_path,
    FALSE AS file_moved
FROM
    {{ ref('final_demos_app_document') }} AS final_docs
LEFT JOIN
    {{ ref('docs_pmda_s3_file_list') }} AS s3_files
    ON
        final_docs._internal_pmda_s3_file_id = s3_files.pmda_s3_file_id
-- Filter to be removed once NOT NULL enforced by tests!
WHERE
    final_docs._internal_pmda_s3_file_id IS NOT NULL
