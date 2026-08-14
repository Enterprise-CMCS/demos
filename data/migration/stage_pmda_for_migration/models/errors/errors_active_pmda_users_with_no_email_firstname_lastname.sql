SELECT *
FROM
    {{ ref('users_active_pmda_users') }}
WHERE
    (firstname = '')
    OR (firstname IS NULL)
    OR (lastname = '')
    OR (lastname IS NULL)
    OR (email = '')
    OR (email IS NULL)
    OR (email !~ '^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
