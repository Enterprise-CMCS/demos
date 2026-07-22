SELECT
    cp.id AS person_id,
    au.geo_ansi_state_cd AS state_id
FROM
    {{ source('legacy_pmda_raw', 'user_authrzd_state_acs') }} AS au
INNER JOIN
    {{ ref('users_cleaned_demos_app_person_state_user') }} AS cp
    ON
        au.user_id = cp._legacy_id
WHERE
    au.geo_ansi_state_cd NOT IN (
        SELECT e1.geo_ansi_state_cd FROM {{ ref('errors_pmda_person_states_with_invalid_states') }} AS e1
    )
