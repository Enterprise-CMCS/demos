SELECT * FROM {{ ref('apps_pmda_contacts_long') }}
WHERE
    person_type_id = 'demos-cms-user'
    AND role_id = 'State Point of Contact'
