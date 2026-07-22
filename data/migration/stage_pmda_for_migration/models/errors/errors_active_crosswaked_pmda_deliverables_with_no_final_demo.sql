SELECT *
FROM
    {{ ref('deliverables_crosswalked_pmda_deliverables' ) }}
WHERE
    _legacy_mdcd_demo_id NOT IN (SELECT e1._legacy_mdcd_demo_id FROM {{ ref('final_demos_app_demonstration') }} AS e1)
