WITH file_names AS (
    SELECT
        file_path AS s3_prefix_and_file_name,
        split_part(file_path, '/', -1) AS file_name,
        size_bytes,
        etag
    FROM
        {{ ref("raw_pmda_s3_file_list") }}
),

separated_prefix AS (
    SELECT
        row_number() OVER () AS pmda_s3_file_id,
        left(s3_prefix_and_file_name, length(s3_prefix_and_file_name) - length(file_name)) AS s3_prefix,
        file_name,
        s3_prefix_and_file_name,
        size_bytes,
        etag
    FROM
        file_names
    WHERE
        file_name != ''
        AND file_name != 's3_file_list.csv'
),

with_prefix_parts AS (
    SELECT
        pmda_s3_file_id,
        s3_prefix,
        file_name,
        s3_prefix_and_file_name,
        split_part(s3_prefix, '/', 1) AS s3_prefix_p1,
        split_part(s3_prefix, '/', 2) AS s3_prefix_p2,
        split_part(s3_prefix, '/', 3) AS s3_prefix_p3,
        split_part(s3_prefix, '/', 4) AS s3_prefix_p4,
        split_part(s3_prefix, '/', 5) AS s3_prefix_p5,
        split_part(s3_prefix, '/', 6) AS s3_prefix_p6,
        split_part(s3_prefix, '/', 7) AS s3_prefix_p7,
        size_bytes,
        etag
    FROM
        separated_prefix
)

SELECT
    pmda_s3_file_id,
    s3_prefix,
    file_name,
    s3_prefix_and_file_name,
    size_bytes,
    etag,
    CASE
        WHEN s3_prefix LIKE 'upload/deliverable/%' THEN s3_prefix_p4::INTEGER
    END AS extracted_mdcd_dlvrbl_id,
    CASE
        WHEN s3_prefix LIKE 'upload/deliverable/cms/%' THEN 'C'
        WHEN s3_prefix LIKE 'upload/deliverable/state/%' THEN 'S'
    END AS extracted_cmt_orgn_cd,
    CASE
        WHEN s3_prefix LIKE 'upload/demonstration/program_monitoring/%' THEN s3_prefix_p4::INTEGER
    END AS extracted_mdcd_demo_id,
    CASE
        WHEN s3_prefix LIKE 'upload/appmgmtdemo/docrepo/%' THEN s3_prefix_p4::INTEGER
    END AS extracted_mdcd_pendg_demo_id,
    CASE
        WHEN s3_prefix LIKE 'upload/deliverable/%' THEN 'deliverable'
        WHEN s3_prefix LIKE 'upload/appmgmtdemo/docrepo/%' THEN 'docrepo'
        WHEN s3_prefix LIKE 'upload/demonstration/program_monitoring/%' THEN 'program_monitoring'
    END AS pmda_s3_doc_source_type

FROM
    with_prefix_parts
