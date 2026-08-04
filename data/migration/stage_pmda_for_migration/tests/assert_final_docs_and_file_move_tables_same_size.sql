WITH c1 AS (
    SELECT count(*) AS doc_count
    FROM
        {{ ref('final_demos_app_document') }}
    -- To be removed once files associated with all docs!
    WHERE
        _internal_pmda_s3_file_id IS NOT NULL
),

c2 AS (
    SELECT count(*) AS file_move_tracker_count
    FROM
        {{ ref('system_file_move_tracker') }}
)

SELECT
    c1.doc_count,
    c2.file_move_tracker_count
FROM
    c1
INNER JOIN
    c2
    ON
        TRUE
WHERE
    c1.doc_count != c2.file_move_tracker_count
