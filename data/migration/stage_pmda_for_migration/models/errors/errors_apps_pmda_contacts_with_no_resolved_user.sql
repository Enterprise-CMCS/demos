SELECT * FROM {{ ref('apps_pmda_contacts_long') }}
WHERE
    person_id IS NULL
