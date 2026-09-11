SELECT * FROM {{ ref('deliverables_pmda_dlvrbl_comment') }}
WHERE content = '' OR content IS NULL
