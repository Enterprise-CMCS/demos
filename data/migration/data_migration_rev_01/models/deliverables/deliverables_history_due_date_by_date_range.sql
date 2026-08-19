WITH filtered_and_cleaned_history AS (
    SELECT
        history.mdcd_dlvrbl_id,
        coalesce(
            (history.dlvrbl_due_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York',
            (history.mdcd_dlvrbl_prvs_due_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York'
        ) AS dlvrbl_due_dt,
        history.hstry_updtd_dt
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_dlvrbl_hstry') }} AS history
    -- This filter is because we don't care about histories for deliverables that aren't going to be included
    INNER JOIN
        {{ ref('deliverables_active_pmda_deliverables') }} AS active_deliv
        ON
            history.mdcd_dlvrbl_id = active_deliv.mdcd_dlvrbl_id
),

-- Need to get two different shifts
-- One to get the time things changed
-- One to figure out each run of the same due date
date_shifts AS (
    SELECT
        mdcd_dlvrbl_id,
        dlvrbl_due_dt,
        hstry_updtd_dt,
        lead(hstry_updtd_dt, 1)
            OVER (PARTITION BY mdcd_dlvrbl_id ORDER BY hstry_updtd_dt)
            AS next_hstry_updtd_dt,
        lag(dlvrbl_due_dt, 1) OVER (PARTITION BY mdcd_dlvrbl_id ORDER BY hstry_updtd_dt) AS last_dlvrbl_due_dt
    FROM
        filtered_and_cleaned_history
),

range_groups AS (
    SELECT
        mdcd_dlvrbl_id,
        dlvrbl_due_dt,
        hstry_updtd_dt,
        next_hstry_updtd_dt,
        last_dlvrbl_due_dt,

        -- Whenever the due date doesn't match the last one (or is null), its a new group of due dates
        -- Taking the sum of this gives a sequential group number within each mdcd_dlvrbl_id
        sum(CASE WHEN dlvrbl_due_dt != last_dlvrbl_due_dt OR last_dlvrbl_due_dt IS NULL THEN 1 ELSE 0 END)
            OVER (
                PARTITION BY
                    mdcd_dlvrbl_id
                ORDER BY
                    hstry_updtd_dt
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            )
            AS due_dt_range_group
    FROM
        date_shifts
),

-- Now, derive the first / last flags from the group variable, not the date directly
-- Prevents issues where a due date changes and changes back
flagged_range_groups AS (
    SELECT
        mdcd_dlvrbl_id,
        dlvrbl_due_dt,
        hstry_updtd_dt,
        next_hstry_updtd_dt,
        last_dlvrbl_due_dt,
        due_dt_range_group,
        row_number() OVER (PARTITION BY mdcd_dlvrbl_id ORDER BY hstry_updtd_dt) = 1 AS is_first_of_dlvrbl,
        row_number() OVER (PARTITION BY mdcd_dlvrbl_id, due_dt_range_group ORDER BY hstry_updtd_dt)
        = 1 AS is_first_of_dlvrbl_date,
        row_number() OVER (PARTITION BY mdcd_dlvrbl_id ORDER BY hstry_updtd_dt DESC) = 1 AS is_last_of_dlvrbl,
        row_number() OVER (PARTITION BY mdcd_dlvrbl_id, due_dt_range_group ORDER BY hstry_updtd_dt DESC)
        = 1 AS is_last_of_dlvrbl_date
    FROM range_groups
),

calculated_values AS (
    SELECT
        mdcd_dlvrbl_id,
        dlvrbl_due_dt,
        hstry_updtd_dt,
        due_dt_range_group,
        CASE
            WHEN is_first_of_dlvrbl THEN '1900-01-01 00:00:00.000'::TIMESTAMP AT TIME ZONE 'America/New_York'
            WHEN is_first_of_dlvrbl_date THEN hstry_updtd_dt
        END AS from_time,
        CASE
            WHEN is_last_of_dlvrbl THEN '2299-12-31 23:59:59.999'::TIMESTAMP AT TIME ZONE 'America/New_York'
            WHEN is_last_of_dlvrbl_date THEN next_hstry_updtd_dt - INTERVAL '1 ms'
        END AS to_time
    FROM flagged_range_groups
)

SELECT DISTINCT
    mdcd_dlvrbl_id,
    dlvrbl_due_dt,
    first_value(from_time) OVER (PARTITION BY mdcd_dlvrbl_id, due_dt_range_group ORDER BY hstry_updtd_dt) AS from_time,
    first_value(to_time) OVER (PARTITION BY mdcd_dlvrbl_id, due_dt_range_group ORDER BY hstry_updtd_dt DESC) AS to_time
FROM
    calculated_values
