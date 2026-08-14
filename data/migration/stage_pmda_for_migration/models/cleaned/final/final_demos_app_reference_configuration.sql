WITH refs_with_agreements AS (
    SELECT
        gen_random_uuid() AS id,
        refs.id AS reference_id,
        ref_agreements.id AS reference_agreement_id,
        CASE
            WHEN refs._legacy_archived_flag = 0 THEN 'Active'
            WHEN refs._legacy_archived_flag = 1 THEN 'Inactive'
        END AS status_id
    FROM
        {{ ref('final_demos_app_reference') }} AS refs
    LEFT JOIN
        {{ ref('final_demos_app_reference_agreement') }} AS ref_agreements
        ON
            refs._internal_reference_agreement_id = ref_agreements._internal_reference_agreement_id
    WHERE
        refs._internal_reference_agreement_id IS NOT NULL
),

refs_without_agreements AS (
    SELECT
        gen_random_uuid() AS id,
        refs.id AS reference_id,
        NULL::UUID AS reference_agreement_id,
        CASE
            WHEN refs._legacy_archived_flag = 0 THEN 'Active'
            WHEN refs._legacy_archived_flag = 1 THEN 'Inactive'
        END AS status_id
    FROM
        {{ ref('final_demos_app_reference') }} AS refs
    WHERE
        refs._internal_reference_agreement_id IS NULL
)

SELECT *
FROM refs_with_agreements
UNION ALL
SELECT *
FROM refs_without_agreements
