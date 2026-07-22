SELECT
    ura.user_id,
    max(CASE WHEN role_to_person_type.person_type_id = 'demos-admin' THEN 1 ELSE 0 END) AS has_demos_admin,
    max(CASE WHEN role_to_person_type.person_type_id = 'demos-cms-user' THEN 1 ELSE 0 END) AS has_demos_cms_user,
    max(CASE WHEN role_to_person_type.person_type_id = 'demos-state-user' THEN 1 ELSE 0 END) AS has_demos_state_user,
    max(CASE WHEN role_to_person_type.person_type_id = 'non-user-contact' THEN 1 ELSE 0 END) AS has_non_user_contact
FROM
    {{ source('legacy_pmda_raw', 'user_role_asgnmt') }} AS ura
INNER JOIN
    {{ ref('crosswalk_role_cd_to_person_type_id') }} AS role_to_person_type
    ON
        ura.role_cd = role_to_person_type.role_cd
GROUP BY
    ura.user_id
