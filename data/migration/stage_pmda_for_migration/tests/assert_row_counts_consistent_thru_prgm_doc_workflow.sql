WITH c1 AS (
    SELECT count(*) AS c1_rows
    FROM
        {{ ref('docs_pmda_prgm_docs_rpstry_crosswalked_desc') }}
),

c2 AS (
    SELECT count(*) AS c2_rows
    FROM
        {{ ref('docs_pmda_prgm_docs_rpstry_with_person') }}
),

c3 AS (
    SELECT count(*) AS c3_rows
    FROM
        {{ ref('docs_pmda_prgm_docs_rpstry_with_demo') }}
)

SELECT
    c1.c1_rows,
    c2.c2_rows,
    c3.c3_rows
FROM
    c1
INNER JOIN c2
    ON
        TRUE
INNER JOIN c3
    ON
        TRUE
WHERE
    NOT (c1.c1_rows = all(ARRAY[c2.c2_rows, c3.c3_rows]))
