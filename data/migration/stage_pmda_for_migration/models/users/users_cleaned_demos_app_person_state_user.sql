SELECT * FROM
    {{ ref('cleaned_demos_app_person') }}
WHERE
    person_type_id = 'demos-state-user'
