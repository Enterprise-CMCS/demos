WITH file_names AS (
    SELECT
        file_path AS s3_prefix_and_file_name,
        split_part(file_path, '/', -1) AS file_name,
        size_bytes,
        etag
    FROM
        {{ ref("raw_pmda_s3_file_list") }}
)

SELECT
    left(s3_prefix_and_file_name, length(s3_prefix_and_file_name) - length(file_name)) AS s3_prefix,
    file_name,
    s3_prefix_and_file_name,
    size_bytes,
    etag
FROM
    file_names
WHERE
    file_name != ''
