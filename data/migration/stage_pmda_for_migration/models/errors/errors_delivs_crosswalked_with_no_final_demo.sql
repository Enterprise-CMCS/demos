WITH finalized_demos AS (
    SELECT _legacy_mdcd_demo_id
    FROM
        {{ ref('final_demos_app_demonstration') }}
    WHERE
        status_id = 'Approved'
)

SELECT *
FROM
    {{ ref('deliverables_crosswalked_pmda_deliverables' ) }}
WHERE
    _legacy_mdcd_demo_id NOT IN (SELECT e1._legacy_mdcd_demo_id FROM finalized_demos AS e1)
