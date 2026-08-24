SELECT * FROM
    {{ ref('cleaned_demos_app_finalized_extension') }}
UNION ALL
SELECT * FROM
    {{ ref('cleaned_demos_app_in_prog_extension_current_phase') }}
