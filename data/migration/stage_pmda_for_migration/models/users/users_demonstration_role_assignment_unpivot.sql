WITH source_demo AS (
    SELECT
        mdcd_demo_id,
        geo_ansi_state_cd,
        proj_ofcr_user_id,
        bkup_proj_ofcr_user_id,
        ro_fincl_lead_user_id,
        tchncl_drctr_user_id,
        mntrg_eval_tchncl_drctr_user_id,
        ro_mntrg_lead_user_id,
        anlyst_user_id,
        anlyst_scndry_user_id,
        mc_anlyst_id,
        hcbs_anlyst_id,
        state_prmry_poc_user_id,
        state_scndry_poc_user_id,
        state_3rd_poc_user_id,
        state_4th_poc_user_id,
        state_5th_poc_user_id
    FROM {{ source('legacy_pmda_raw', 'mdcd_demo') }}
),

unpivoted AS (
    SELECT
        d.mdcd_demo_id,
        d.geo_ansi_state_cd,
        role_slot.source_column,
        role_slot.legacy_user_id
    FROM source_demo AS d
    CROSS JOIN LATERAL (
        VALUES
        ('proj_ofcr_user_id', d.proj_ofcr_user_id),
        ('bkup_proj_ofcr_user_id', d.bkup_proj_ofcr_user_id),
        ('ro_fincl_lead_user_id', d.ro_fincl_lead_user_id),
        ('tchncl_drctr_user_id', d.tchncl_drctr_user_id),
        ('mntrg_eval_tchncl_drctr_user_id', d.mntrg_eval_tchncl_drctr_user_id),
        ('ro_mntrg_lead_user_id', d.ro_mntrg_lead_user_id),
        ('anlyst_user_id', d.anlyst_user_id),
        ('anlyst_scndry_user_id', d.anlyst_scndry_user_id),
        ('mc_anlyst_id', d.mc_anlyst_id),
        ('hcbs_anlyst_id', d.hcbs_anlyst_id),
        ('state_prmry_poc_user_id', d.state_prmry_poc_user_id),
        ('state_scndry_poc_user_id', d.state_scndry_poc_user_id),
        ('state_3rd_poc_user_id', d.state_3rd_poc_user_id),
        ('state_4th_poc_user_id', d.state_4th_poc_user_id),
        ('state_5th_poc_user_id', d.state_5th_poc_user_id)
    ) AS role_slot (source_column, legacy_user_id)
)

SELECT *
FROM unpivoted
WHERE coalesce(legacy_user_id, 0) <> 0
