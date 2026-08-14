SELECT
    pmda_ref._internal_reference_id,
    pmda_ref_demo_tag.tag_name_id
FROM
    {{ ref('references_pmda_refs') }} AS pmda_ref
CROSS JOIN
    LATERAL (
        VALUES
        ('Other', pmda_ref.demo_type_other),
        ('Continuous Eligibility', pmda_ref.demo_type_continuous_eligiblity),
        ('Enrollment Cap', pmda_ref.demo_type_enrollment_cap),
        ('Employment Supports', pmda_ref.demo_type_employment_supports),
        ('Family Planning Program', pmda_ref.demo_type_family_planning_program),
        ('Healthy Behavior Incentives', pmda_ref.demo_type_healthy_behavior_incentives),
        ('Lifetime Limits', pmda_ref.demo_type_lifetime_limits),
        ('Non-Eligibility Period', pmda_ref.demo_type_non_eligibility_period),
        ('Premiums/Cost-Sharing', pmda_ref.demo_type_premiums_cost_sharing),
        ('Retroactive Eligibility', pmda_ref.demo_type_retroactive_eligibility),
        ('Serious Mental Illness (SMI)', pmda_ref.demo_type_serious_mental_illness),
        ('Substance Use Disorder (SUD)', pmda_ref.demo_type_substance_use_disorder),
        ('Targeted Population Expansion', pmda_ref.demo_type_targeted_population_expansion),
        ('Traditional Health Care Practices Amendment', pmda_ref.demo_type_traditional_health_care_practices_amendment)
    ) AS pmda_ref_demo_tag (tag_name_id, tag_present_flag)
WHERE
    pmda_ref_demo_tag.tag_present_flag = 1
