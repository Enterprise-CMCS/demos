SELECT * FROM {{ ref('apps_unfiltered_staged_finalized_pmda_extension') }}
WHERE
    _legacy_temp_extnsn_ind = 1
