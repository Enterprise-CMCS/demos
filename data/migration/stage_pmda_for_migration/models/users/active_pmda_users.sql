SELECT
    u.id AS original_id,
    gen_random_uuid() AS new_id,
    u.username AS original_username,
    u.firstname,
    u.lastname,
    u.email
FROM
    {{ source('legacy_pmda_raw', 'users') }} AS u
WHERE
    u.active = 1
