SELECT * FROM {{ ref('apps_pmda_contacts_long') }}
WHERE
    person_type_id = 'non-user-contact'
