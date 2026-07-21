SELECT uasa.*
FROM
    {{ source('legacy_pmda_raw', 'user_authrzd_state_acs') }} AS uasa
LEFT JOIN
    {{ source('demos_app', 'state') }} AS s
    ON
        uasa.geo_ansi_state_cd = s.id
WHERE
    s.id IS NULL
