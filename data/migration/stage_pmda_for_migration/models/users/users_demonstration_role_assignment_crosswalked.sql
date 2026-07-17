SELECT DISTINCT
    udrau.mdcd_demo_id,
    udrau.geo_ansi_state_cd AS state_id,
    udrau.source_column,
    udrau.legacy_user_id,
    cp.id AS person_id,
    cp.person_type_id,
    cdr.role_id,
    cdr.is_primary
FROM
    {{ ref('users_demonstration_role_assignment_unpivot') }} AS udrau
INNER JOIN
    {{ ref('crosswalk_demonstration_role') }} AS cdr
    ON
        udrau.source_column = cdr.source_column
LEFT JOIN
    {{ ref('cleaned_demos_app_person') }} AS cp
    ON
        udrau.legacy_user_id = cp._legacy_id
