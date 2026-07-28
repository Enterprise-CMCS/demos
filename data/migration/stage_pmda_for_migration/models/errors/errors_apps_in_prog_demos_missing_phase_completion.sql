SELECT
    cleaned_demos.id,
    cleaned_demos.mdcd_demo_aplctn_id,
    cleaned_demos.name,
    cleaned_demos.state_id,
    'Demo missing phase completion data' AS error_reason
FROM {{ ref('cleaned_demos_app_demonstration_in_prog_demos') }} AS cleaned_demos
LEFT JOIN {{ ref('apps_in_prog_phase_completion') }} AS phase_completion
    ON
        cleaned_demos.mdcd_demo_aplctn_id = phase_completion.mdcd_demo_aplctn_id
WHERE
    phase_completion.mdcd_demo_aplctn_id IS NULL
