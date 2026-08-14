WITH c1 AS (
    SELECT count(*) AS ref_count FROM {{ ref('final_demos_app_reference') }}
),

c2 AS (
    SELECT count(*) AS ref_config_count FROM {{ ref('final_demos_app_reference_configuration') }}
)

SELECT
    c1.ref_count,
    c2.ref_config_count
FROM
    c1
INNER JOIN c2
    ON
        TRUE
WHERE
    c1.ref_count != c2.ref_config_count
