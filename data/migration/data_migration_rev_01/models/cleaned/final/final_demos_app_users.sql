-- there is exactly one case of a referenced user on a deliverable extension that exists as only a person.
-- This, paired with an ArbitraryActionConfiguration, promotes the person to a demos-cms-user
SELECT
    id,
    'demos-state-user' AS person_type_id,
    NULL::UUID AS cognito_subject,
    NULL AS username,
    TRUE AS is_migrated_from_pmda,
    FALSE AS has_logged_in,
    created_at,
    updated_at,
    _legacy_users_id
FROM
    {{ source('legacy_pmda_staged', 'final_demos_app_person') }}
WHERE
    id = '63f08f6a-4ed9-4401-94ff-c186463735a7'
