WITH references_from_seed AS (
    SELECT
        extracted._internal_reference_id,
        extracted.rfrnc_matl_id AS _legacy_rfrnc_matl_id,
        CASE
            WHEN extracted._internal_reference_agreement_id = 0 THEN NULL
            ELSE extracted._internal_reference_agreement_id
        END AS _internal_reference_agreement_id,
        extracted.archived,
        extracted.file_name,
        extracted.file_path,
        doclist.pmda_s3_file_id,
        refmat.rfrnc_matl_name,
        refmat.rfrnc_matl_desc,
        refmat.creatd_dt,
        refmat.updtd_dt,
        CASE
            WHEN
                extracted.file_path IN (
                    'reference/mrt_templates_reference_only/Base/1.00/',
                    'reference/mrt_technical_specification_reference_only/Base/',
                    'reference/mrt_technical_specification_reference_only/Base/1.00/',
                    'reference/mrt_templates_reference_only/Demo/1.00/'
                ) THEN 1
            ELSE 0
        END AS demo_type_other
    FROM
        {{ ref('extracted_references_from_pmda') }} AS extracted

    LEFT JOIN
        {{ ref('docs_pmda_s3_file_list') }} AS doclist
        ON
            extracted.file_name = doclist.file_name
            AND extracted.file_path = doclist.s3_prefix

    -- Inner join acceptable here because of test in seeds.yml
    INNER JOIN
        {{ source('legacy_pmda_raw', 'rfrnc_matl') }} AS refmat
        ON
            extracted.rfrnc_matl_id = refmat.rfrnc_matl_id
)

SELECT
    _internal_reference_id,
    _legacy_rfrnc_matl_id,
    _internal_reference_agreement_id,
    archived,
    pmda_s3_file_id,
    rfrnc_matl_name,
    rfrnc_matl_desc,
    creatd_dt,
    updtd_dt,
    demo_type_other,
    CASE
        WHEN demo_type_other = 0 AND (file_path LIKE '%CE%' OR file_name LIKE '%CE%') THEN 1
        ELSE 0
    END AS demo_type_continuous_eligiblity,
    CASE
        WHEN demo_type_other = 0 AND (file_path LIKE '%ENC%' OR file_name LIKE '%ENC%') THEN 1
        ELSE 0
    END AS demo_type_enrollment_cap,
    CASE
        WHEN demo_type_other = 0 AND (file_path LIKE '%ESUP%' OR file_name LIKE '%ESUP%') THEN 1
        ELSE 0
    END AS demo_type_employment_supports,
    CASE
        WHEN demo_type_other = 0 AND (file_path LIKE '%FP%' OR file_name LIKE '%FP%') THEN 1
        ELSE 0
    END AS demo_type_family_planning_program,
    CASE
        WHEN demo_type_other = 0 AND (file_path LIKE '%HBI%' OR file_name LIKE '%HBI%') THEN 1
        ELSE 0
    END AS demo_type_healthy_behavior_incentives,
    CASE
        WHEN demo_type_other = 0 AND (file_path LIKE '%LFLI%' OR file_name LIKE '%LFLI%') THEN 1
        ELSE 0
    END AS demo_type_lifetime_limits,
    CASE
        WHEN demo_type_other = 0 AND (file_path LIKE '%NELIG%' OR file_name LIKE '%NELIG%') THEN 1
        ELSE 0
    END AS demo_type_non_eligibility_period,
    CASE
        WHEN demo_type_other = 0 AND (file_path LIKE '%PRCS%' OR file_name LIKE '%PRCS%') THEN 1
        ELSE 0
    END AS demo_type_premiums_cost_sharing,
    CASE
        WHEN demo_type_other = 0 AND (file_path LIKE '%RETRO%' OR file_name LIKE '%RETRO%') THEN 1
        ELSE 0
    END AS demo_type_retroactive_eligibility,
    CASE
        WHEN demo_type_other = 0 AND (file_path LIKE '%SMI%' OR file_name LIKE '%SMI%') THEN 1
        ELSE 0
    END AS demo_type_serious_mental_illness,
    CASE
        WHEN demo_type_other = 0 AND (file_path LIKE '%SUD%' OR file_name LIKE '%SUD%') THEN 1
        ELSE 0
    END AS demo_type_substance_use_disorder,
    CASE
        WHEN demo_type_other = 0 AND (file_path LIKE '%TEX%' OR file_name LIKE '%TEX%') THEN 1
        ELSE 0
    END AS demo_type_targeted_population_expansion,
    CASE
        WHEN demo_type_other = 0 AND (file_path LIKE '%THCP%' OR file_name LIKE '%THCP%') THEN 1
        ELSE 0
    END AS demo_type_traditional_health_care_practices_amendment
FROM references_from_seed
