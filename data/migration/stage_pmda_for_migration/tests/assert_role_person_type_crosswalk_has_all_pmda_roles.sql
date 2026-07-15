-- Error in cases where we did not map a role_cd to a person_type_id

SELECT rr.role_cd
FROM
    {{ source('legacy_pmda_raw', 'role_rfrnc') }} AS rr
WHERE
    rr.role_cd NOT IN (SELECT cw.role_cd FROM {{ ref('crosswalk_role_cd_to_person_type_id') }} AS cw)
