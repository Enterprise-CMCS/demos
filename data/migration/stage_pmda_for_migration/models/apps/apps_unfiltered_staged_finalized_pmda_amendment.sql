SELECT
    'Amendment' AS application_type_id,
    fa.demonstration_id,
    fa.demonstration_status_id,
    fa.mdcd_demo_amndmt_name AS name, -- noqa: RF04
    trim(fa.amndmt_desc) AS description,
    fa.effective_date,
    fa.status_id,
    (fa.amndmt_stus_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS status_updated_at,
    'Approval Summary' AS current_phase_id,
    cw1.signature_level_id,
    fa.creatd_dt,
    fa._legacy_mdcd_demo_amndmt_id,
    fa._legacy_mdcd_pendg_demo_id,
    fa._legacy_mdcd_demo_aplctn_id
FROM
    {{ ref('apps_active_finalized_pmda_amendments') }} AS fa
LEFT JOIN {{ ref('crosswalk_mdcd_demo_aplctn_sgntr_lvl_cd_to_signature_level_id') }} AS cw1
    ON
        fa.mdcd_demo_aplctn_sgntr_lvl_cd = cw1.mdcd_demo_aplctn_sgntr_lvl_cd
