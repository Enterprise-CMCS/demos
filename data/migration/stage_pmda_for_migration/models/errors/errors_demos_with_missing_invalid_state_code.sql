SELECT *
FROM {{ source('legacy_pmda_raw', 'mdcd_demo') }} AS d
WHERE
    geo_ansi_state_cd IS NULL
    OR NOT EXISTS (
        SELECT 1
        FROM {{ source('demos_app', 'state') }} AS s
        WHERE s.id = d.geo_ansi_state_cd
    )
