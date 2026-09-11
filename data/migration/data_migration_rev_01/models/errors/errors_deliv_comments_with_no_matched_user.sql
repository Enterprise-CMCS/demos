SELECT * FROM {{ ref('deliverables_pmda_dlvrbl_comment') }}
WHERE author_user_id IS NULL
