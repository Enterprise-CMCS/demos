SELECT * FROM
    {{ ref('final_demos_app_person') }}
WHERE
    person_type_id = 'demos-state-user'
