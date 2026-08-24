SELECT * FROM {{ ref('apps_unfiltered_staged_finalized_pmda_extension') }}
WHERE
    signature_level_id IS NULL
    OR signature_level_id NOT IN ('OA', 'OCD')
