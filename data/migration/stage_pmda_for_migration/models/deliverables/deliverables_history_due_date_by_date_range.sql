WITH filtered_and_cleaned_history AS (
    SELECT
        history.mdcd_dlvrbl_id,
        coalesce(history.dlvrbl_due_dt, history.mdcd_dlvrbl_prvs_due_dt) AS dlvrbl_due_dt,
        history.hstry_updtd_dt
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_dlvrbl_hstry') }} AS history
    INNER JOIN
        {{ ref('deliverables_active_pmda_deliverables') }} AS active_deliv
        ON
            history.mdcd_dlvrbl_id = active_deliv.mdcd_dlvrbl_id
),

shifts AS (
    SELECT
        mdcd_dlvrbl_id,
        dlvrbl_due_dt,
        hstry_updtd_dt,
        lead(hstry_updtd_dt, 1)
            OVER (PARTITION BY mdcd_dlvrbl_id ORDER BY hstry_updtd_dt)
            AS next_hstry_updtd_dt,
        row_number() OVER (
            PARTITION BY
                mdcd_dlvrbl_id,
                dlvrbl_due_dt
            ORDER BY
                hstry_updtd_dt
        ) = 1 AS is_first_of_dlvrbl_date,
        row_number() OVER (
            PARTITION BY
                mdcd_dlvrbl_id,
                dlvrbl_due_dt
            ORDER BY
                hstry_updtd_dt DESC
        ) = 1 AS is_last_of_dlvrbl_date,
        row_number() OVER (PARTITION BY mdcd_dlvrbl_id ORDER BY hstry_updtd_dt) = 1 AS is_first_of_dlvrbl,
        row_number() OVER (PARTITION BY mdcd_dlvrbl_id ORDER BY hstry_updtd_dt DESC) = 1 AS is_last_of_dlvrbl
    FROM
        filtered_and_cleaned_history
),

calculated_values AS (
    SELECT
        mdcd_dlvrbl_id,
        dlvrbl_due_dt,
        hstry_updtd_dt,
        next_hstry_updtd_dt,
        CASE
            WHEN is_first_of_dlvrbl THEN '1900-01-01 00:00:00.000'::TIMESTAMP AT TIME ZONE 'America/New_York'
            WHEN is_first_of_dlvrbl_date THEN hstry_updtd_dt
        END AS from_time,
        CASE
            WHEN is_last_of_dlvrbl THEN '2299-12-31 23:59:59.999'::TIMESTAMP AT TIME ZONE 'America/New_York'
            WHEN is_last_of_dlvrbl_date THEN next_hstry_updtd_dt - INTERVAL '1 ms'
        END AS to_time
    FROM shifts
)

SELECT DISTINCT
    mdcd_dlvrbl_id,
    dlvrbl_due_dt,
    first_value(from_time) OVER (PARTITION BY mdcd_dlvrbl_id, dlvrbl_due_dt ORDER BY hstry_updtd_dt) AS from_time,
    first_value(to_time) OVER (PARTITION BY mdcd_dlvrbl_id, dlvrbl_due_dt ORDER BY hstry_updtd_dt DESC) AS to_time
FROM
    calculated_values
