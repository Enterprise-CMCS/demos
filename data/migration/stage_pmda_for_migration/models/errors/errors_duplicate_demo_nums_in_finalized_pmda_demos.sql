WITH dupe_mdcd_num AS (
    SELECT
        cleaned_mdcd_demo_num,
        count(*) AS n_instances
    FROM
        {{ ref('apps_active_finalized_pmda_demos_mdcd_num_validations') }}
    GROUP BY
        cleaned_mdcd_demo_num
    HAVING
        count(*) > 1
),

dupe_mdcd_scndry_num AS (
    SELECT
        cleaned_mdcd_scndry_demo_num,
        count(*) AS n_instances
    FROM
        {{ ref('apps_active_finalized_pmda_demos_mdcd_num_validations') }}
    GROUP BY
        cleaned_mdcd_scndry_demo_num
    HAVING
        count(*) > 1
)

SELECT *
FROM
    {{ ref('apps_active_finalized_pmda_demos_mdcd_num_validations') }}
WHERE
    (
        cleaned_mdcd_demo_num IS NOT NULL
        AND cleaned_mdcd_demo_num IN (SELECT e1.cleaned_mdcd_demo_num FROM dupe_mdcd_num AS e1)
    )
    OR (
        cleaned_mdcd_scndry_demo_num IS NOT NULL
        AND cleaned_mdcd_scndry_demo_num IN (SELECT e2.cleaned_mdcd_scndry_demo_num FROM dupe_mdcd_scndry_num AS e2)
    )
