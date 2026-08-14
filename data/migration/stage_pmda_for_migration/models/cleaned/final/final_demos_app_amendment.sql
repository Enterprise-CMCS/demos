SELECT * FROM
    {{ ref('cleaned_demos_app_finalized_amendment') }}
UNION ALL
SELECT * FROM
    {{ ref('cleaned_demos_app_in_prog_amendment_current_phase') }}
