-- This CTE lets us filter out things that are expected to have a NULL _legacy_mdcd_demo_id
-- Deliverables can only exist on approved demonstrations
WITH finalized_demos AS (
    SELECT
        id,
        _legacy_mdcd_demo_id,
        expiration_date
    FROM
        {{ ref('final_demos_app_demonstration') }}
    WHERE
        status_id = 'Approved'
),

-- The fallback CMS owner is Liz Hill
fallback_cms_owner AS (
    SELECT
        id,
        person_type_id
    FROM
        {{ ref('final_demos_app_person') }}
    WHERE
        _legacy_users_id = 828
)

SELECT
    gen_random_uuid() AS id,
    cw1.deliverable_type_id,
    pmda_deliv.mdcd_dlvrbl_name AS name, -- noqa: RF04,
    f_demo.id AS demonstration_id,
    'Approved' AS demonstration_status_id, -- Only approved demos may have deliverables,
    cw2.deliverable_status_id AS status_id,

    -- Get the raw value from trying to resolve the person ID
    -- But use the coalesce to get the "resolved" version with placeholder
    -- Allows for reporting of how many are altered
    f_person.id AS raw_cms_owner_user_id,
    f_person.person_type_id AS raw_cms_owner_person_type_id,
    coalesce(f_person.id, fb.id) AS cms_owner_user_id,
    coalesce(f_person.person_type_id, fb.person_type_id) AS cms_owner_person_type_id,

    -- When a deliverable is open-ended, we use the demonstrations expiration date
    -- Otherwise, we use the dlvrbl_due_date; if it is null, this will be filtered
    CASE
        WHEN pmda_deliv.mdcd_dlvrbl_open_endd_ind = 1 THEN f_demo.expiration_date
        ELSE (pmda_deliv.dlvrbl_due_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York'
    END AS due_date,

    CASE WHEN pmda_deliv.mdcd_dlvrbl_open_endd_ind = 1 THEN 'Open Ended' ELSE 'Normal' END AS due_date_type_id,
    TRUE AS expected_to_be_submitted, -- TODO: need to figure out this logic
    coalesce(pmda_deliv.creatd_dt, current_timestamp) AS created_at,
    coalesce(pmda_deliv.updtd_dt, pmda_deliv.creatd_dt, current_timestamp) AS updated_at,
    f_demo.expiration_date AS demo_expiration_date,
    pmda_deliv.mdcd_demo_id AS _legacy_mdcd_demo_id,
    pmda_deliv.mdcd_dlvrbl_id AS _legacy_mdcd_dlvrbl_id,
    pmda_deliv.mdcd_dlvrbl_crnt_stus_cd AS _legacy_mdcd_dlvrbl_crnt_stus_cd
FROM
    {{ ref('deliverables_active_pmda_deliverables') }} AS pmda_deliv
LEFT JOIN
    {{ ref('crosswalk_mdcd_dlvrbl_type_cd_to_deliverable_type_id') }} AS cw1
    ON
        pmda_deliv.mdcd_dlvrbl_type_cd = cw1.mdcd_dlvrbl_type_cd
LEFT JOIN
    finalized_demos AS f_demo
    ON
        pmda_deliv.mdcd_demo_id = f_demo._legacy_mdcd_demo_id
LEFT JOIN
    {{ ref('crosswalk_mdcd_dlvrbl_crnt_stus_cd_to_deliverable_status_id') }} AS cw2
    ON
        pmda_deliv.mdcd_dlvrbl_crnt_stus_cd = cw2.mdcd_dlvrbl_crnt_stus_cd
LEFT JOIN
    {{ ref('final_demos_app_person') }} AS f_person
    ON
        pmda_deliv.creatd_user_id = f_person._legacy_users_id
        AND f_person.person_type_id IN ('demos-admin', 'demos-cms-user')
INNER JOIN
    fallback_cms_owner AS fb
    ON
        TRUE
