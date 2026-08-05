WITH base_list AS (
    SELECT
        final_docs.id AS final_document_id,
        final_docs.s3_path AS final_document_s3_path,
        final_docs._internal_pmda_s3_file_id,
        s3_files.s3_prefix_and_file_name AS legacy_pmda_s3_path
    FROM
        {{ ref('final_demos_app_document') }} AS final_docs
    LEFT JOIN
        {{ ref('docs_pmda_s3_file_list') }} AS s3_files
        ON
            final_docs._internal_pmda_s3_file_id = s3_files.pmda_s3_file_id
    -- Filter to be removed once NOT NULL enforced by tests!
    WHERE
        final_docs._internal_pmda_s3_file_id IS NOT NULL
),

file_extensions AS (
    SELECT
        final_document_id,
        final_document_s3_path,
        _internal_pmda_s3_file_id,
        legacy_pmda_s3_path,
        CASE
            WHEN
                pg_input_is_valid(split_part(legacy_pmda_s3_path, '.', -1), 'integer')
                THEN lower(split_part(legacy_pmda_s3_path, '.', -2))
            ELSE lower(split_part(legacy_pmda_s3_path, '.', -1))
        END AS legacy_pmda_file_extension
    FROM
        base_list
)

SELECT
    final_document_id,
    final_document_s3_path,
    _internal_pmda_s3_file_id,
    legacy_pmda_s3_path,
    legacy_pmda_file_extension,
    CASE legacy_pmda_file_extension
        WHEN 'pdf' THEN 'application/pdf'
        WHEN 'docx' THEN 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        WHEN 'xlsx' THEN 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        WHEN 'xlsm' THEN 'application/vnd.ms-excel.sheet.macroEnabled.12'
        WHEN 'zip' THEN 'application/zip'
        WHEN 'xls' THEN 'application/vnd.ms-excel'
        WHEN 'doc' THEN 'application/msword'
        ELSE 'application/octet-stream'
    END AS file_mime_type,
    FALSE AS file_has_been_moved
FROM
    file_extensions
