SELECT * FROM {{ ref('deliverables_crosswalked_pmda_deliverables') }}
WHERE raw_cms_owner_user_id IS NULL
