SELECT
    cdap.id AS person_id,
    dptitsri.role_id,
    cdap.person_type_id,
    'System' AS grant_level_id
FROM
    {{ ref('cleaned_demos_app_person') }} AS cdap
INNER JOIN
    {{ ref('default_person_type_id_to_system_role_id') }} AS dptitsri
    ON
        cdap.person_type_id = dptitsri.person_type_id
