WITH long_pmda_demo_contacts AS (
    SELECT
        pmda_demo.mdcd_demo_id AS _legacy_mdcd_demo_id,
        NULL::INTEGER AS _legacy_mdcd_pendg_demo_id,
        pmda_role.demos_role_id,
        pmda_role.demos_is_primary_role,
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
        ) AS pmda_role (demos_role_id, _legacy_pmda_user_id, demos_is_primary_role)
    WHERE
        pmda_demo.dltd_ind = 0
        AND pmda_role._legacy_pmda_user_id IS NOT NULL
),

long_pmda_pendg_demo_contacts AS (
    SELECT
        NULL::INTEGER AS _legacy_mdcd_demo_id,
        pmda_pendg_demo.mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        pmda_pendg_role.demos_role_id,
        pmda_pendg_role.demos_is_primary_role,
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
        ) AS pmda_pendg_role (demos_role_id, _legacy_pmda_user_id, demos_is_primary_role)
    WHERE
        pmda_pendg_demo.dltd_ind = 0
        AND pmda_pendg_role._legacy_pmda_user_id IS NOT NULL
),

pmda_demo_contacts_with_joins AS (
    SELECT
        contact._legacy_mdcd_demo_id,
        contact._legacy_mdcd_pendg_demo_id,
        contact.demos_role_id,
        contact.demos_is_primary_role,
        contact._legacy_pmda_user_id,
        app.id AS demo_id,
        person.id AS person_id
    FROM
        long_pmda_demo_contacts AS contact
    -- Fine to inner join here; don't care about filtering contacts if the application isn't thered
    INNER JOIN
        {{ ref('final_demos_app_application' ) }} AS app
        ON
            contact._legacy_mdcd_demo_id = app._legacy_mdcd_demo_id
            AND app.application_type_id = 'Demonstration'
    LEFT JOIN
        {{ ref('final_demos_app_person') }} AS person
        ON
            contact._legacy_pmda_user_id = person._legacy_users_id
),

pmda_pendg_demo_contacts_with_joins AS (
    SELECT
        contact._legacy_mdcd_demo_id,
        contact._legacy_mdcd_pendg_demo_id,
        contact.demos_role_id,
        contact.demos_is_primary_role,
        contact._legacy_pmda_user_id,
        app.id AS demo_id,
        person.id AS person_id
    FROM
        long_pmda_pendg_demo_contacts AS contact
    -- Fine to inner join here; don't care about filtering contacts if the application isn't thered
    INNER JOIN
        {{ ref('final_demos_app_application' ) }} AS app
        ON
            contact._legacy_mdcd_demo_id = app._legacy_mdcd_demo_id
            AND app.application_type_id = 'Demonstration'
    LEFT JOIN
        {{ ref('final_demos_app_person') }} AS person
        ON
            contact._legacy_pmda_user_id = person._legacy_users_id
)

SELECT * FROM pmda_demo_contacts_with_joins
UNION ALL
SELECT * FROM pmda_pendg_demo_contacts_with_joins
