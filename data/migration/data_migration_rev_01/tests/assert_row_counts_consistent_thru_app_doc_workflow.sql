WITH c1 AS (
    SELECT count(*) AS c1_rows
    FROM
        {{ ref('docs_pmda_app_docs_rpstry') }}
),

c2 AS (
    SELECT count(*) AS c2_rows
    FROM
        {{ ref('docs_pmda_app_docs_rpstry_doc_type_phase') }}
),

c3 AS (
    SELECT count(*) AS c3_rows
    FROM
        {{ ref('docs_pmda_app_docs_with_person') }}
),

c4 AS (
    SELECT count(*) AS c4_rows
    FROM
        {{ ref('docs_pmda_app_docs_with_application') }}
)

SELECT
    c1.c1_rows,
    c2.c2_rows,
    c3.c3_rows,
    c4.c4_rows
FROM
    c1
INNER JOIN c2
    ON
        TRUE
INNER JOIN c3
    ON
        TRUE
INNER JOIN c4
    ON
        TRUE
WHERE
    NOT (c1.c1_rows = all(ARRAY[c2.c2_rows, c3.c3_rows, c4.c4_rows]))
