-- Has all the other contacts except the primary POs
SELECT
    contacts.person_id,
    contacts.demonstration_id,
    contacts.role_id,
    contacts.state_id,
    contacts.person_type_id,
    contacts.grant_level_id,
    contacts._internal_is_primary
FROM
    {{ ref('apps_pmda_contacts_long') }} AS contacts
WHERE
    NOT EXISTS (
        SELECT 1 FROM {{ ref('errors_apps_pmda_contacts_with_no_resolved_user') }} AS e1
        WHERE
            -- Use the legacy user ID here because the person_id may not have been resolved
            contacts._legacy_pmda_user_id = e1._legacy_pmda_user_id
            AND contacts.demonstration_id = e1.demonstration_id
            AND contacts.role_id = e1.role_id
    )
    AND NOT EXISTS (
        SELECT 1 FROM {{ ref('errors_apps_pmda_contacts_with_non_user_person_type') }} AS e2
        WHERE
            contacts._legacy_pmda_user_id = e2._legacy_pmda_user_id
            AND contacts.demonstration_id = e2.demonstration_id
            AND contacts.role_id = e2.role_id
    )
    AND NOT EXISTS (
        SELECT 1 FROM {{ ref('errors_apps_pmda_contacts_with_state_users_assigned_cms_roles') }} AS e3
        WHERE
            contacts._legacy_pmda_user_id = e3._legacy_pmda_user_id
            AND contacts.demonstration_id = e3.demonstration_id
            AND contacts.role_id = e3.role_id
    )
    AND NOT EXISTS (
        SELECT 1 FROM {{ ref('errors_apps_pmda_contacts_with_cms_users_assigned_state_roles') }} AS e4
        WHERE
            contacts._legacy_pmda_user_id = e4._legacy_pmda_user_id
            AND contacts.demonstration_id = e4.demonstration_id
            AND contacts.role_id = e4.role_id
    )
