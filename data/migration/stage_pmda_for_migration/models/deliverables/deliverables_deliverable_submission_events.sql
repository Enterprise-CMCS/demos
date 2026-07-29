SELECT history.*
FROM
    {{ source('legacy_pmda_raw', 'mdcd_dlvrbl_stus_hstry') }} AS history
WHERE
    history.dltd_ind = 0
    AND history.mdcd_dlvrbl_stus_cd = 3
    AND history.mdcd_dlvrbl_id IN (
        SELECT active.mdcd_dlvrbl_id FROM {{ ref('deliverables_active_pmda_deliverables') }} AS active
    )
