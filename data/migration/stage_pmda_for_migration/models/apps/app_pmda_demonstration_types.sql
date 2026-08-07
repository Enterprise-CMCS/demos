WITH demo_types_union AS (

    SELECT
        'Annual Limits' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_ann_lmts_pgm_dtl') }}
    UNION ALL
    SELECT
        'Aggregate Cap' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_agg_cap_pgm_dtl') }}
    UNION ALL
    SELECT
        'Basic Health Plan (BHP)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_basic_hlth_plan_pgm_dtl') }}
    UNION ALL
    SELECT
        'Behavioral Health' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_bhvrl_hlth_pgm_dtl') }}
    UNION ALL
    SELECT
        'Beneficiary Engagement' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_bene_enggmt_pgm_dtl') }}
    UNION ALL
    SELECT
        'Children''s Health Insurance Program (CHIP)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_chip_pgm_dtl') }}
    UNION ALL
    SELECT
        'CMMI - AHEAD' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_ahead_pgm_dtl') }}
    UNION ALL
    SELECT
        'CMMI - Integrated Care for Kids (IncK)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_intgrtd_care_pgm_dtl') }}
    UNION ALL
    SELECT
        'CMMI - Maternal Opioid Misuse (MOM)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_matrnl_opioid_use_pgm_dtl') }}
    UNION ALL
    SELECT
        'Community Engagement' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_cmnty_enggmt_pgm_dtl') }}
    UNION ALL
    SELECT
        'Contingency Management' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_cntgcy_mgmt_pgm_dtl') }}
    UNION ALL
    SELECT
        'Continuous Eligibility' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_cntnus_elgblty_pgm_dtl') }}
    UNION ALL
    SELECT
        'Delivery System Reform Incentive Payment (DSRIP)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_dsrip_pgm_dtl') }}
    UNION ALL
    SELECT
        'Dental' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_dntl_pgm_dtl') }}
    UNION ALL
    SELECT
        'Designated State Health Programs (DSHP)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_dsgntd_state_hlth_pgm_dtl') }}
    UNION ALL
    SELECT
        'Employment Supports' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_emplymt_sprt_pgm_dtl') }}
    UNION ALL
    SELECT
        'End-Stage Renal Disease (ESRD)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_esrd_pgm_dtl') }}
    UNION ALL
    SELECT
        'Enrollment Cap' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_enrlmt_cap_pgm_dtl') }}
    UNION ALL
    SELECT
        'Expenditure Cap' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_expndtr_cap_pgm_dtl') }}
    UNION ALL
    SELECT
        'Former Foster Care Youth (FFCY)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_ffcy_pgm_dtl') }}
    UNION ALL
    SELECT
        'Global Payment Program (GPP)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_glbl_pymt_pgm_dtl') }}
    UNION ALL
    SELECT
        'Health Equity' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_hlth_eqty_pgm_dtl') }}
    UNION ALL
    SELECT
        'Health-Related Social Needs (HRSN)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_hlth_rltd_scl_nds_pgm_dtl') }}
    UNION ALL
    SELECT
        'Healthy Behavior Incentives' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_hlthy_bhvr_incntv_pgm_dtl') }}
    UNION ALL
    SELECT
        'HIV' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_hiv_pgm_dtl') }}
    UNION ALL
    SELECT
        'Home Community Based Services (HCBS)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_hcbs_pgm_dtl') }}
    UNION ALL
    SELECT
        'Lead Exposure' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_lead_expo_pgm_dtl') }}
    UNION ALL
    SELECT
        'Lifetime Limits' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_lftm_lmts_pgm_dtl') }}
    UNION ALL
    SELECT
        'Long-Term Services and Supports (LTSS)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_ltss_pgm_dtl') }}
    UNION ALL
    SELECT
        'Managed Care' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_mc_pgm_dtl') }}
    UNION ALL
    SELECT
        'Marketplace Coverage / Premium Assistance Wrap' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_mktplc_cvrg_pgm_dtl') }}
    UNION ALL
    SELECT
        'New Adult Group Expansion' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_new_adlt_grp_expnsn_pgm_dtl') }}
    UNION ALL
    SELECT
        'Non-Eligibility Period' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_non_elgblty_prd_pgm_dtl') }}
    UNION ALL
    SELECT
        'Non-Emergency Medical Transportation (NEMT)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_non_emer_mdcl_trnsprtn_pgm_dtl') }}
    UNION ALL
    SELECT
        'Partial Expansion of the New Adult Group' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_prtl_expnsn_pgm_dtl') }}
    UNION ALL
    SELECT
        'Pharmacy' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_phrmcy_pgm_dtl') }}
    UNION ALL
    SELECT
        'PHE-Appendix K' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_apndx_k_pgm_dtl') }}
    UNION ALL
    SELECT
        'PHE-COVID-19' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_covid_pgm_dtl') }}
    UNION ALL
    SELECT
        'PHE-Reasonable Opportunity Period (ROP)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_rsnbl_oprtnty_prd_pgm_dtl') }}
    UNION ALL
    SELECT
        'PHE-Risk Mitigation' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_risk_mtgtn_pgm_dtl') }}
    UNION ALL
    SELECT
        'PHE-Vaccine Coverage' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_vccn_cvrg_pgm_dtl') }}
    UNION ALL
    SELECT
        'Premium Assistance / Employer-Sponsored Health Insurance (ESI)/ Qualified Health Plan (QHP)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_prm_astnc_pgm_dtl') }}
    UNION ALL
    SELECT
        'Premiums / Cost-Sharing' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_prm_pgm_dtl') }}
    UNION ALL
    SELECT
        'Provider Cap' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_prvdr_cap_pgm_dtl') }}
    UNION ALL
    SELECT
        'Provider Restriction' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_prvdr_rstctn_pgm_dtl') }}
    UNION ALL
    SELECT
        'ReEntry' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_reentry_pgm_dtl') }}
    UNION ALL
    SELECT
        'Reproductive Health: Family Planning' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_fmly_plng_pgm_dtl') }}
    UNION ALL
    SELECT
        'Reproductive Health: Fertility' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_frtlty_pgm_dtl') }}
    UNION ALL
    SELECT
        'Reproductive Health: Hyde' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_hyde_pgm_dtl') }}
    UNION ALL
    SELECT
        'Reproductive Health: Maternal Health' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_matrnl_hlth_pgm_dtl') }}
    UNION ALL
    SELECT
        'Reproductive Health: Post-Partum Extension' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_pstprtm_extnsn_pgm_dtl') }}
    UNION ALL
    SELECT
        'Reproductive Health: RAD' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_rsrcs_abrtn_dlvry_pgm_dtl') }}
    UNION ALL
    SELECT
        'Retroactive Eligibility' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_rtro_elgblty_pgm_dtl') }}
    UNION ALL
    SELECT
        'Serious Mental Illness (SMI)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_srus_mentl_ill_pgm_dtl') }}
    UNION ALL
    SELECT
        'Special Needs' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_spcl_nds_pgm_dtl') }}
    UNION ALL
    SELECT
        'Substance use Disorder (SUD)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_sud_pgm_dtl') }}
    UNION ALL
    SELECT
        'Targeted Population Expansion' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_trgtd_expnsn_pgm_dtl') }}
    UNION ALL
    SELECT
        'Tribal' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_trbl_pgm_dtl') }}
    UNION ALL
    SELECT
        'Uncompensated Care' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_uncompd_care_pgm_dtl') }}
    UNION ALL
    SELECT
        'Value Based Care (VBC)' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_val_bsd_care_pgm_dtl') }}
    UNION ALL
    SELECT
        'Vision' AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_vsn_pgm_dtl') }}
    UNION ALL
    SELECT
        -- for demo type other, the detailed_name is used as the tag name
        mdcd_othr_pgm_dtl_name AS tag_name_id,
        from_dt AS _legacy_from_dt,
        to_dt AS _legacy_to_dt,
        creatd_dt AS _legacy_creatd_dt,
        mdcd_demo_id AS _legacy_mdcd_demo_id,
        dltd_ind AS _legacy_dltd_ind
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_othr_pgm_dtl') }}
)

SELECT
    tag_name_id,
    'Demonstration Type' AS tag_type_id,
    (_legacy_from_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS effective_date,
    (_legacy_to_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS expiration_date,
    _legacy_creatd_dt AS created_at,
    _legacy_creatd_dt AS updated_at,
    _legacy_mdcd_demo_id
FROM demo_types_union
WHERE _legacy_dltd_ind = 0
