-- in PMDA demonstration types are each stored in their own table. In order to extract the relevent
-- data, we need to union all the tables together. This process is applied for demontration types on 
-- pending demonstrations and approved demonstrations. 
WITH demo_types_union AS (

    SELECT
        'Annual Limits' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_ann_lmts_pgm_dtl') }}
    UNION ALL
    SELECT
        'Aggregate Cap' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_agg_cap_pgm_dtl') }}
    UNION ALL
    SELECT
        'Basic Health Plan (BHP)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_basic_hlth_plan_pgm_dtl') }}
    UNION ALL
    SELECT
        'Behavioral Health' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_bhvrl_hlth_pgm_dtl') }}
    UNION ALL
    SELECT
        'Beneficiary Engagement' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_bene_enggmt_pgm_dtl') }}
    UNION ALL
    SELECT
        'Children''s Health Insurance Program (CHIP)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_chip_pgm_dtl') }}
    UNION ALL
    SELECT
        'CMMI - AHEAD' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_ahead_pgm_dtl') }}
    UNION ALL
    SELECT
        'CMMI - Integrated Care for Kids (IncK)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_intgrtd_care_pgm_dtl') }}
    UNION ALL
    SELECT
        'CMMI - Maternal Opioid Misuse (MOM)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_matrnl_opioid_use_pgm_dtl') }}
    UNION ALL
    SELECT
        'Community Engagement' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_cmnty_enggmt_pgm_dtl') }}
    UNION ALL
    SELECT
        'Contingency Management' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_cntgcy_mgmt_pgm_dtl') }}
    UNION ALL
    SELECT
        'Continuous Eligibility' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_cntnus_elgblty_pgm_dtl') }}
    UNION ALL
    SELECT
        'Delivery System Reform Incentive Payment (DSRIP)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_dsrip_pgm_dtl') }}
    UNION ALL
    SELECT
        'Dental' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_dntl_pgm_dtl') }}
    UNION ALL
    SELECT
        'Designated State Health Programs (DSHP)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_dsgntd_state_hlth_pgm_dtl') }}
    UNION ALL
    SELECT
        'Employment Supports' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_emplymt_sprt_pgm_dtl') }}
    UNION ALL
    SELECT
        'End-Stage Renal Disease (ESRD)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_esrd_pgm_dtl') }}
    UNION ALL
    SELECT
        'Enrollment Cap' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_enrlmt_cap_pgm_dtl') }}
    UNION ALL
    SELECT
        'Expenditure Cap' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_expndtr_cap_pgm_dtl') }}
    UNION ALL
    SELECT
        'Former Foster Care Youth (FFCY)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_ffcy_pgm_dtl') }}
    UNION ALL
    SELECT
        'Global Payment Program (GPP)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_glbl_pymt_pgm_dtl') }}
    UNION ALL
    SELECT
        'Health Equity' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_hlth_eqty_pgm_dtl') }}
    UNION ALL
    SELECT
        'Health-Related Social Needs (HRSN)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_hlth_rltd_scl_nds_pgm_dtl') }}
    UNION ALL
    SELECT
        'Healthy Behavior Incentives' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_hlthy_bhvr_incntv_pgm_dtl') }}
    UNION ALL
    SELECT
        'HIV' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_hiv_pgm_dtl') }}
    UNION ALL
    SELECT
        'Home Community Based Services (HCBS)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_hcbs_pgm_dtl') }}
    UNION ALL
    SELECT
        'Lead Exposure' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_lead_expo_pgm_dtl') }}
    UNION ALL
    SELECT
        'Lifetime Limits' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_lftm_lmts_pgm_dtl') }}
    UNION ALL
    SELECT
        'Long-Term Services and Supports (LTSS)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_ltss_pgm_dtl') }}
    UNION ALL
    SELECT
        'Managed Care' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_mc_pgm_dtl') }}
    UNION ALL
    SELECT
        'Marketplace Coverage/Premium Assistance Wrap' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_mktplc_cvrg_pgm_dtl') }}
    UNION ALL
    SELECT
        'New Adult Group Expansion' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_new_adlt_grp_expnsn_pgm_dtl') }}
    UNION ALL
    SELECT
        'Non-Eligibility Period' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_non_elgblty_prd_pgm_dtl') }}
    UNION ALL
    SELECT
        'Non-Emergency Medical Transportation (NEMT)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_non_emer_mdcl_trnsprtn_pgm_dtl') }}
    UNION ALL
    SELECT
        'Partial Expansion of the New Adult Group' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_prtl_expnsn_pgm_dtl') }}
    UNION ALL
    SELECT
        'Pharmacy' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_phrmcy_pgm_dtl') }}
    UNION ALL
    SELECT
        'PHE-Appendix K' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_apndx_k_pgm_dtl') }}
    UNION ALL
    SELECT
        'PHE-COVID-19' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_covid_pgm_dtl') }}
    UNION ALL
    SELECT
        'PHE-Reasonable Opportunity Period (ROP)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_rsnbl_oprtnty_prd_pgm_dtl') }}
    UNION ALL
    SELECT
        'PHE-Risk Mitigation' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_risk_mtgtn_pgm_dtl') }}
    UNION ALL
    SELECT
        'PHE-Vaccine Coverage' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_vccn_cvrg_pgm_dtl') }}
    UNION ALL
    SELECT
        'Premium Assistance/Employer-Sponsored Health Insurance (ESI)/Qualified Health Plan (QHP)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_prm_astnc_pgm_dtl') }}
    UNION ALL
    SELECT
        'Premiums/Cost-Sharing' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_prm_pgm_dtl') }}
    UNION ALL
    SELECT
        'Provider Cap' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_prvdr_cap_pgm_dtl') }}
    UNION ALL
    SELECT
        'Provider Restriction' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_prvdr_rstctn_pgm_dtl') }}
    UNION ALL
    SELECT
        'ReEntry' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_reentry_pgm_dtl') }}
    UNION ALL
    SELECT
        'Reproductive Health: Family Planning' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_fmly_plng_pgm_dtl') }}
    UNION ALL
    SELECT
        'Reproductive Health: Fertility' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_frtlty_pgm_dtl') }}
    UNION ALL
    SELECT
        'Reproductive Health: Hyde' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_hyde_pgm_dtl') }}
    UNION ALL
    SELECT
        'Reproductive Health: Maternal Health' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_matrnl_hlth_pgm_dtl') }}
    UNION ALL
    SELECT
        'Reproductive Health: Post-Partum Extension' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_pstprtm_extnsn_pgm_dtl') }}
    UNION ALL
    SELECT
        'Reproductive Health: RAD' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_rsrcs_abrtn_dlvry_pgm_dtl') }}
    UNION ALL
    SELECT
        'Retroactive Eligibility' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_rtro_elgblty_pgm_dtl') }}
    UNION ALL
    SELECT
        'Serious Mental Illness (SMI)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_srus_mentl_ill_pgm_dtl') }}
    UNION ALL
    SELECT
        'Special Needs' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_spcl_nds_pgm_dtl') }}
    UNION ALL
    SELECT
        'Substance Use Disorder (SUD)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_sud_pgm_dtl') }}
    UNION ALL
    SELECT
        'Targeted Population Expansion' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_trgtd_expnsn_pgm_dtl') }}
    UNION ALL
    SELECT
        'Tribal' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_trbl_pgm_dtl') }}
    UNION ALL
    SELECT
        'Uncompensated Care' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_uncompd_care_pgm_dtl') }}
    UNION ALL
    SELECT
        'Value Based Care (VBC)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_val_bsd_care_pgm_dtl') }}
    UNION ALL
    SELECT
        'Vision' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        FALSE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_vsn_pgm_dtl') }}
    UNION ALL
    SELECT
        -- for demo type other, the detailed_name is used as the tag name
        mdcd_othr_pgm_dtl_name AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
        dltd_ind AS _legacy_dltd_ind,
        TRUE AS _is_other
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pendg_othr_pgm_dtl') }}
)

SELECT
    tag_name_id,
    'Demonstration Type' AS tag_type_id,
    (_legacy_from_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS effective_date,
    (_legacy_to_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS expiration_date,
    _legacy_creatd_dt AS created_at,
    _legacy_creatd_dt AS updated_at,
    _legacy_mdcd_pendg_demo_id,
    _is_other
FROM demo_types_union
WHERE _legacy_dltd_ind = 0
