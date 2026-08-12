SELECT * FROM {{ ref('apps_unfiltered_staged_in_prog_amendments') }}
WHERE
    signature_level_id IS NOT NULL
    AND signature_level_id != 'OA'
    AND signature_level_id != 'OCD'
