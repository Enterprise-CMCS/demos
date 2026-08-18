WITH stripped_down_medicaid_number AS (
    SELECT
        mdcd_demo_id,
        mdcd_demo_num AS original_mdcd_demo_num,
        mdcd_scndry_demo_num AS original_mdcd_scndry_demo_num,
        regexp_replace(replace(replace(mdcd_demo_num, '-', ''), '/', ''), '\s', '', 'g') AS stripped_mdcd_demo_num,
        regexp_replace(replace(replace(mdcd_scndry_demo_num, '-', ''), '/', ''), '\s', '', 'g')
            AS stripped_mdcd_scndry_demo_num
    FROM
        {{ ref('apps_active_finalized_pmda_demos') }}
),

initial_validation_status AS (
    SELECT
        mdcd_demo_id,
        original_mdcd_demo_num,
        stripped_mdcd_demo_num AS stripped_mdcd_demo_num_unfixed,
        CASE
            WHEN original_mdcd_demo_num ~ '^11-W-[0-9]{5}/([1-9]|10)$' THEN 'Valid Medicaid ID'
            WHEN original_mdcd_demo_num ~ '^21-W-[0-9]{5}/([1-9]|10)$' THEN 'Valid CHIP ID'
            WHEN stripped_mdcd_demo_num IS NULL OR trim(stripped_mdcd_demo_num) = '' THEN 'Invalid'
            WHEN length(stripped_mdcd_demo_num) NOT BETWEEN 9 AND 10 THEN 'Invalid'
            WHEN substring(stripped_mdcd_demo_num, 3, 1) != 'W' THEN 'Invalid'
            WHEN length(stripped_mdcd_demo_num) = 10 AND substring(stripped_mdcd_demo_num, 9, 2) != '10' THEN 'Invalid'
            WHEN
                length(stripped_mdcd_demo_num) = 9
                AND substring(stripped_mdcd_demo_num, 9, 1) NOT IN ('1', '2', '3', '4', '5', '6', '7', '8', '9', '0')
                THEN 'Invalid'
            WHEN substring(stripped_mdcd_demo_num, 1, 2) = '21' THEN 'Possibly Valid CHIP ID'
            WHEN substring(stripped_mdcd_demo_num, 1, 2) = '11' THEN 'Possibly Valid Medicaid ID'
            ELSE 'Invalid'
        END AS mdcd_demo_num_initial_validation_status,
        original_mdcd_scndry_demo_num,
        stripped_mdcd_scndry_demo_num AS stripped_mdcd_scndry_demo_num_unfixed,
        CASE
            WHEN original_mdcd_scndry_demo_num ~ '^11-W-[0-9]{5}/([1-9]|10)$' THEN 'Valid Medicaid ID'
            WHEN original_mdcd_scndry_demo_num ~ '^21-W-[0-9]{5}/([1-9]|10)$' THEN 'Valid CHIP ID'
            WHEN
                stripped_mdcd_scndry_demo_num IS NULL
                OR trim(stripped_mdcd_scndry_demo_num) = ''
                OR trim(stripped_mdcd_scndry_demo_num) = 'None' -- Handles specific case of Maine demo 2522
                THEN 'Valid Missing'
            WHEN length(stripped_mdcd_scndry_demo_num) NOT BETWEEN 9 AND 10 THEN 'Invalid'
            WHEN substring(stripped_mdcd_scndry_demo_num, 3, 1) != 'W' THEN 'Invalid'
            WHEN
                length(stripped_mdcd_scndry_demo_num) = 10 AND substring(stripped_mdcd_scndry_demo_num, 9, 2) != '10'
                THEN 'Invalid'
            WHEN
                length(stripped_mdcd_scndry_demo_num) = 9
                AND substring(stripped_mdcd_scndry_demo_num, 9, 1) NOT IN (
                    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'
                )
                THEN 'Invalid'
            WHEN substring(stripped_mdcd_scndry_demo_num, 1, 2) = '21' THEN 'Possibly Valid CHIP ID'
            WHEN substring(stripped_mdcd_scndry_demo_num, 1, 2) = '11' THEN 'Possibly Valid Medicaid ID'
            ELSE 'Invalid'
        END AS mdcd_scndry_demo_num_initial_validation_status
    FROM
        stripped_down_medicaid_number
),

region_10_correction AS (
    SELECT
        mdcd_demo_id,
        original_mdcd_demo_num,
        mdcd_demo_num_initial_validation_status,
        CASE
            WHEN
                mdcd_demo_num_initial_validation_status IN ('Possibly Valid CHIP ID', 'Possibly Valid Medicaid ID')
                AND length(stripped_mdcd_demo_num_unfixed) = 9
                AND substring(stripped_mdcd_demo_num_unfixed, 9, 1) = '0'
                THEN substring(stripped_mdcd_demo_num_unfixed, 1, 8) || '10'
            ELSE stripped_mdcd_demo_num_unfixed
        END AS stripped_mdcd_demo_num,
        original_mdcd_scndry_demo_num,
        mdcd_scndry_demo_num_initial_validation_status,
        CASE
            WHEN
                mdcd_scndry_demo_num_initial_validation_status IN (
                    'Possibly Valid CHIP ID', 'Possibly Valid Medicaid ID'
                )
                AND length(stripped_mdcd_scndry_demo_num_unfixed) = 9
                AND substring(stripped_mdcd_scndry_demo_num_unfixed, 9, 1) = '0'
                THEN substring(stripped_mdcd_scndry_demo_num_unfixed, 1, 8) || '10'
            ELSE stripped_mdcd_scndry_demo_num_unfixed
        END AS stripped_mdcd_scndry_demo_num
    FROM
        initial_validation_status
),

cleaned_medicaid_nums AS (
    SELECT
        mdcd_demo_id,
        original_mdcd_demo_num,
        stripped_mdcd_demo_num,
        mdcd_demo_num_initial_validation_status,
        CASE
            WHEN
                mdcd_demo_num_initial_validation_status IN ('Valid Medicaid ID', 'Valid CHIP ID')
                THEN original_mdcd_demo_num
            WHEN
                mdcd_demo_num_initial_validation_status IN ('Possibly Valid Medicaid ID', 'Possibly Valid CHIP ID')
                AND substring(stripped_mdcd_demo_num, 1, 2)
                || '-W-'
                || substring(stripped_mdcd_demo_num, 4, 5)
                || '/'
                || substring(stripped_mdcd_demo_num, 9, 2)
                ~ '^(11|21)-W-[0-9]{5}/([1-9]|10)$'
                THEN
                    substring(stripped_mdcd_demo_num, 1, 2)
                    || '-W-'
                    || substring(stripped_mdcd_demo_num, 4, 5)
                    || '/'
                    || substring(stripped_mdcd_demo_num, 9, 2)
        END AS cleaned_mdcd_demo_num,
        original_mdcd_scndry_demo_num,
        stripped_mdcd_scndry_demo_num,
        mdcd_scndry_demo_num_initial_validation_status,
        CASE
            WHEN
                mdcd_scndry_demo_num_initial_validation_status IN ('Valid Medicaid ID', 'Valid CHIP ID')
                THEN original_mdcd_scndry_demo_num
            WHEN
                mdcd_scndry_demo_num_initial_validation_status IN (
                    'Possibly Valid Medicaid ID', 'Possibly Valid CHIP ID'
                )
                AND substring(stripped_mdcd_scndry_demo_num, 1, 2)
                || '-W-'
                || substring(stripped_mdcd_scndry_demo_num, 4, 5)
                || '/'
                || substring(stripped_mdcd_scndry_demo_num, 9, 2)
                ~ '^(11|21)-W-[0-9]{5}/([1-9]|10)$'
                THEN
                    substring(stripped_mdcd_scndry_demo_num, 1, 2)
                    || '-W-'
                    || substring(stripped_mdcd_scndry_demo_num, 4, 5)
                    || '/'
                    || substring(stripped_mdcd_scndry_demo_num, 9, 2)
        END AS cleaned_mdcd_scndry_demo_num
    FROM
        region_10_correction
)

SELECT
    mdcd_demo_id,
    original_mdcd_demo_num,
    CASE
        -- Primary ID was CHIP, looked up Medicaid ID online
        WHEN mdcd_demo_id = 2470 THEN '11-W-00381/3'

        -- Primary ID was CHIP, could not find Medicaid ID online
        WHEN mdcd_demo_id IN (2481, 2648) THEN NULL

        -- Otherwise, just use cleaned ID
        ELSE cleaned_mdcd_demo_num
    END AS cleaned_mdcd_demo_num,
    CASE
        -- If manually fixed, mark format valid
        WHEN mdcd_demo_id IN (2470, 2481, 2648) THEN 'Valid'
        WHEN cleaned_mdcd_demo_num IS NOT NULL THEN 'Valid'
        ELSE 'Invalid'
    END AS cleaned_mdcd_demo_num_format_valid,
    CASE
        -- If manually fixed, mark location as valid
        WHEN mdcd_demo_id IN (2470, 2481, 2648) THEN 'Valid'
        WHEN cleaned_mdcd_demo_num IS NULL THEN 'Invalid'
        WHEN mdcd_demo_num_initial_validation_status IN ('Valid Medicaid ID', 'Possibly Valid Medicaid ID') THEN 'Valid'
        WHEN mdcd_demo_num_initial_validation_status IN ('Valid CHIP ID', 'Possibly Valid CHIP ID') THEN 'Invalid'
    END AS cleaned_mdcd_demo_num_location_valid,
    original_mdcd_scndry_demo_num,
    CASE

        -- Tagged as CHIP in PMDA with no code, found on Medicaid.gov
        WHEN mdcd_demo_id = 2266 THEN '21-W-00074/9'
        WHEN mdcd_demo_id = 2232 THEN '21-W-00068/2'

        -- TennCare III had Medicaid ID for TennCare II in the secondary slot, nulling out
        WHEN mdcd_demo_id = 2265 THEN NULL

        -- These three had CHIP ID as primary ID so place it in the correct field
        WHEN mdcd_demo_id IN (2470, 2481, 2648) THEN cleaned_mdcd_demo_num

        -- Otherwise, just use cleaned secondary ID
        ELSE cleaned_mdcd_scndry_demo_num
    END AS cleaned_mdcd_scndry_demo_num,
    CASE
        -- Manually fixed, mark format valid
        WHEN mdcd_demo_id IN (2266, 2232) THEN 'Valid'

        -- Manually set to missing, making format valid
        WHEN mdcd_demo_id = 2265 THEN 'Valid'

        -- Manually fixed, mark format valid
        WHEN mdcd_demo_id IN (2470, 2481, 2648) THEN 'Valid'

        -- Otherwise, process normally
        WHEN cleaned_mdcd_scndry_demo_num IS NOT NULL THEN 'Valid'
        WHEN
            cleaned_mdcd_scndry_demo_num IS NULL AND mdcd_scndry_demo_num_initial_validation_status = 'Valid Missing'
            THEN 'Valid'
        ELSE 'Invalid'
    END AS cleaned_mdcd_scndry_demo_num_format_valid,
    CASE
        -- Manually fixed, mark format valid
        WHEN mdcd_demo_id IN (2266, 2232) THEN 'Valid'

        -- Manually set to missing, making format valid
        WHEN mdcd_demo_id = 2265 THEN 'Valid'

        -- Manually fixed, mark format valid
        WHEN mdcd_demo_id IN (2470, 2481, 2648) THEN 'Valid'

        -- Otherwise, process normally
        WHEN
            cleaned_mdcd_scndry_demo_num IS NULL AND mdcd_scndry_demo_num_initial_validation_status = 'Valid Missing'
            THEN 'Valid'
        WHEN cleaned_mdcd_scndry_demo_num IS NULL THEN 'Invalid'
        WHEN
            mdcd_scndry_demo_num_initial_validation_status IN ('Valid Medicaid ID', 'Possibly Valid Medicaid ID')
            THEN 'Invalid'
        WHEN mdcd_scndry_demo_num_initial_validation_status IN ('Valid CHIP ID', 'Possibly Valid CHIP ID') THEN 'Valid'
        ELSE 'Invalid'
    END AS cleaned_mdcd_scndry_demo_num_location_valid
FROM
    cleaned_medicaid_nums
