WITH long_pmda_demo_contacts AS (
    SELECT
        pmda_demo.mdcd_demo_id AS _legacy_mdcd_demo_id,
        NULL::INTEGER AS _legacy_mdcd_pendg_demo_id,
        pmda_role.role_id,
        pmda_role._internal_is_primary,
        pmda_role._legacy_pmda_user_id
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_demo') }} AS pmda_demo
    CROSS JOIN
        LATERAL (
            VALUES
            ('Project Officer', pmda_demo.proj_ofcr_user_id, TRUE),
            ('Policy Technical Director', pmda_demo.tchncl_drctr_user_id, TRUE),
            ('State Point of Contact', pmda_demo.state_prmry_poc_user_id, TRUE),
            ('State Point of Contact', pmda_demo.state_scndry_poc_user_id, FALSE),
            ('State Point of Contact', pmda_demo.state_3rd_poc_user_id, FALSE),
            ('State Point of Contact', pmda_demo.state_4th_poc_user_id, FALSE),
            ('State Point of Contact', pmda_demo.state_5th_poc_user_id, FALSE),
            ('Project Officer', pmda_demo.ro_fincl_lead_user_id, FALSE),
            ('Monitoring & Evaluation Technical Director', pmda_demo.ro_mntrg_lead_user_id, FALSE),
            ('DDME Analyst', pmda_demo.anlyst_user_id, TRUE),
            ('DDME Analyst', pmda_demo.anlyst_scndry_user_id, FALSE),
            ('Project Officer', pmda_demo.bkup_proj_ofcr_user_id, FALSE),
            ('DDME Analyst', pmda_demo.mc_anlyst_id, FALSE),
            ('DDME Analyst', pmda_demo.hcbs_anlyst_id, FALSE)
        ) AS pmda_role (role_id, _legacy_pmda_user_id, _internal_is_primary)
    WHERE
        pmda_demo.dltd_ind = 0
        AND pmda_role._legacy_pmda_user_id IS NOT NULL
),

long_pmda_pendg_demo_contacts AS (
    SELECT
        NULL::INTEGER AS _legacy_mdcd_demo_id,
        pmda_pendg_demo.mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        pmda_pendg_role.role_id,
        pmda_pendg_role._internal_is_primary,
        pmda_pendg_role._legacy_pmda_user_id
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_demo') }} AS pmda_pendg_demo
    CROSS JOIN
        LATERAL (
            VALUES
            ('Project Officer', pmda_pendg_demo.proj_ofcr_user_id, TRUE),
            ('Project Officer', pmda_pendg_demo.bkup_proj_ofcr_user_id, FALSE),
            ('Policy Technical Director', pmda_pendg_demo.tchncl_drctr_user_id, TRUE),
            ('Monitoring & Evaluation Technical Director', pmda_pendg_demo.mntrg_eval_tchncl_drctr_user_id, TRUE),
            ('Project Officer', pmda_pendg_demo.ro_fincl_lead_user_id, FALSE),
            ('Monitoring & Evaluation Technical Director', pmda_pendg_demo.ro_mntrg_lead_user_id, FALSE),
            ('DDME Analyst', pmda_pendg_demo.anlyst_user_id, TRUE),
            ('DDME Analyst', pmda_pendg_demo.anlyst_scndry_user_id, FALSE),
            ('DDME Analyst', pmda_pendg_demo.mc_anlyst_id, FALSE),
            ('DDME Analyst', pmda_pendg_demo.hcbs_anlyst_id, FALSE),
            ('State Point of Contact', pmda_pendg_demo.state_prmry_poc_user_id, TRUE),
            ('State Point of Contact', pmda_pendg_demo.state_scndry_poc_user_id, FALSE),
            ('State Point of Contact', pmda_pendg_demo.state_3rd_poc_user_id, FALSE),
            ('State Point of Contact', pmda_pendg_demo.state_4th_poc_user_id, FALSE),
            ('State Point of Contact', pmda_pendg_demo.state_5th_poc_user_id, FALSE)
        ) AS pmda_pendg_role (role_id, _legacy_pmda_user_id, _internal_is_primary)
    WHERE
        pmda_pendg_demo.dltd_ind = 0
        AND pmda_pendg_role._legacy_pmda_user_id IS NOT NULL
),

pmda_demo_contacts_with_joins AS (
    SELECT
        contact._legacy_mdcd_demo_id,
        contact._legacy_mdcd_pendg_demo_id,
        contact.role_id,
        contact._internal_is_primary,
        contact._legacy_pmda_user_id,
        demo.id AS demonstration_id,
        demo.state_id,
        person.id AS person_id,
        person.person_type_id
    FROM
        long_pmda_demo_contacts AS contact
    -- Fine to inner join here; don't care about filtering contacts if the demonstration isn't there
    INNER JOIN
        {{ ref('final_demos_app_demonstration' ) }} AS demo
        ON
            contact._legacy_mdcd_demo_id = demo._legacy_mdcd_demo_id
    LEFT JOIN
        {{ ref('final_demos_app_person') }} AS person
        ON
            contact._legacy_pmda_user_id = person._legacy_users_id
    -- We don't care about primary project officers as there's a different code path to handle that
    WHERE
        NOT (contact.role_id = 'Project Officer' AND contact._internal_is_primary)
),

pmda_pendg_demo_contacts_with_joins AS (
    SELECT
        contact._legacy_mdcd_demo_id,
        contact._legacy_mdcd_pendg_demo_id,
        contact.role_id,
        contact._internal_is_primary,
        contact._legacy_pmda_user_id,
        demo.id AS demonstration_id,
        demo.state_id,
        person.id AS person_id,
        person.person_type_id
    FROM
        long_pmda_pendg_demo_contacts AS contact
    -- Fine to inner join here; don't care about filtering contacts if the demonstration isn't there
    -- Want to only pick the pending demo ID in cases where a regular demo ID doesn't exist in final
    INNER JOIN
        {{ ref('final_demos_app_demonstration' ) }} AS demo
        ON
            contact._legacy_mdcd_pendg_demo_id = demo._legacy_mdcd_pendg_demo_id
            AND demo._legacy_mdcd_demo_id IS NULL
    LEFT JOIN
        {{ ref('final_demos_app_person') }} AS person
        ON
            contact._legacy_pmda_user_id = person._legacy_users_id
    -- We don't care about primary project officers as there's a different code path to handle that
    WHERE
        NOT (contact.role_id = 'Project Officer' AND contact._internal_is_primary)
)

SELECT
    person_id,
    demonstration_id,
    role_id,
    state_id,
    person_type_id,
    'Demonstration' AS grant_level_id,
    _internal_is_primary,
    _legacy_mdcd_demo_id,
    _legacy_mdcd_pendg_demo_id,
    _legacy_pmda_user_id
FROM pmda_demo_contacts_with_joins
UNION ALL
SELECT
    person_id,
    demonstration_id,
    role_id,
    state_id,
    person_type_id,
    'Demonstration' AS grant_level_id,
    _internal_is_primary,
    _legacy_mdcd_demo_id,
    _legacy_mdcd_pendg_demo_id,
    _legacy_pmda_user_id
FROM
    pmda_pendg_demo_contacts_with_joins
