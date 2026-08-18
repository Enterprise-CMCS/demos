SELECT
    extracted._internal_reference_agreement_id,
    -- Pick the last part of the file assuming it is the file extension
    -- Then, select all characters except the length of the file extension plus 1 more for the .
    left(
        extracted.file_name,
        length(extracted.file_name)
        - length(split_part(extracted.file_name, '.', -1))
        - 1
    ) AS name, -- noqa: RF04
    doclist.pmda_s3_file_id,
    current_timestamp AS created_at,
    current_timestamp AS updated_at
FROM
    {{ ref('extracted_reference_agreements_from_pmda') }} AS extracted

LEFT JOIN
    {{ ref('docs_pmda_s3_file_list') }} AS doclist
    ON
        extracted.file_name = doclist.file_name
        AND extracted.file_path = doclist.s3_prefix
