SELECT DISTINCT mdcd_dlvrbl_id
FROM
    {{ ref('deliverables_history_due_date_by_date_range') }}
WHERE
    dlvrbl_due_dt IS NULL
