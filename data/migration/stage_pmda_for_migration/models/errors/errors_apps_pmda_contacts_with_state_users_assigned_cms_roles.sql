SELECT * FROM {{ ref('apps_pmda_contacts_long') }}
WHERE
    person_type_id = 'demos-state-user'
    AND role_id != 'State Point of Contact'
