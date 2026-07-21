SELECT *
FROM
    {{ ref('apps_active_finalized_pmda_demos_mdcd_num_validations') }}
WHERE
    cleaned_mdcd_demo_num_format_valid = 'Invalid'
    OR cleaned_mdcd_demo_num_location_valid = 'Invalid'
    OR cleaned_mdcd_scndry_demo_num_format_valid = 'Invalid'
    OR cleaned_mdcd_scndry_demo_num_location_valid = 'Invalid'
