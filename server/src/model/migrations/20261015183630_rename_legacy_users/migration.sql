UPDATE demos_app.person AS p
SET
    last_name = p.last_name || ' (Legacy)',
    updated_at = current_timestamp
FROM
    demos_app.users AS u
WHERE
    p.id = u.id
    AND u.is_migrated_from_pmda
    AND NOT u.has_logged_in
    AND NOT p.last_name LIKE '% (Legacy)';
