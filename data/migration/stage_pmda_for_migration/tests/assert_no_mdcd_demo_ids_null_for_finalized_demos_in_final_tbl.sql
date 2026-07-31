SELECT *
FROM
    {{ ref("final_demos_app_demonstration") }}
WHERE
    _legacy_mdcd_demo_id IS NULL
    AND status_id = 'Approved'
