# Drop list rationale

Tables in `pgloader/drop_list.txt` excluded from the MySQL -> `mysql_raw` load.

| Category | Table | Reason |
|---|---|---|
| DROP_BACKUP | `mdcd_ltss_pgm_dtl_bkup` | Operational backup of LTSS program detail; superseded by base table. |
| DROP_BACKUP | `mdcd_ltss_pgm_dtl_hstry_bkup` | Operational backup of LTSS history; superseded by base history. |
| DROP_BACKUP | `mdcd_pendg_fmly_plng_pgm_dtl_bkup` | Operational backup; superseded. |
| DROP_BACKUP | `mdcd_pendg_fmly_plng_pgm_dtl_hstry_bkup` | Operational backup; superseded. |
| DROP_BACKUP | `mdcd_pendg_ltss_pgm_dtl_bkup` | Operational backup; superseded. |
| DROP_BACKUP | `mdcd_pendg_ltss_pgm_dtl_hstry_bkup` | Operational backup; superseded. |
| DROP_BACKUP | `mdcd_prm_astnc_pgm_dtl_bkup` | Operational backup; superseded. |
| DROP_VIEW | `v_demo_mgmt_demo_types` | MySQL view; reconstructed in the DEMOS (`demos_app`) schema if the new app needs it. |
| DROP_VIEW | `v_app_mgmt_demo_types` | MySQL view; same. |
| DROP_VIEW | `v_demo_status_dtl` | MySQL view; same. |
| DROP_VIEW | `v_demo_mgmt_mrt_demo_types` | MySQL view; same. |
| DROP_VIEW | `v_app_mgmt_demo_types_incl_dltd` | MySQL view; same. |
| DROP_EMAIL | `email_hstry` | Notification machinery; no DEMOS counterpart. New app handles notifications differently. |
| DROP_EMAIL | `email_prmry_rcpnt` | Notification machinery; same. |
| DROP_EMAIL | `email_cpy_rcpnt` | Notification machinery; same. |
| DROP_EMAIL | `email_blnd_cpy_rcpnt` | Notification machinery; same. |
| DROP_EMAIL | `email_subj_rfrnc` | Notification machinery; same. |
| DROP_EMAIL | `email_tmplt_rfrnc` | Notification machinery; same. |
| DROP_EMAIL | `email_dstrbtn_grp_mmbr` | Distribution-group membership; notification machinery, no DEMOS counterpart. |
| DROP_EMAIL | `email_dstrbtn_grp_rfrnc` | Distribution-group lookup; same family as `email_subj_rfrnc`/`email_tmplt_rfrnc`. |
| DROP_EMAIL | `sys_ntfctn_bar` | System notification-bar text; notification machinery, no DEMOS counterpart. |
| DROP_OPS | `err_log` | Application error log; new app has its own logging. |
| DROP_OPS | `user_login_hstry` | Login audit; new app has its own auth audit. |
| DROP_OPS | `mntrg_rpt_tmplt_dwnld_hstry` | Download audit; not modeled in DEMOS. |
| DROP_OPS | `mdcd_help_and_sprt_matl_dwnld_hstry` | Download audit; not modeled in DEMOS. |
| DROP_OPS | `mdcd_wbnr_dwnld_hstry` | Webinar download audit; same pattern as the other `*_dwnld_hstry` tables. |
| DROP_OPS | `intrfc_etl_run_cntl` | ETL batch run-control/audit ledger; the new app owns its ingestion. |
| DROP_OPS | `migrations` | MySQL's own schema-migration ledger (`id, migration, batch`); framework metadata. |
| DROP_OPS | `aplctn_vrsn` | App/schema version ledger (`id, script`); empty framework metadata. |
| DROP_LEGACY | `aplctn_mngmt_raw_cleaned` | Long-deprecated flat import from a SharePoint export; 100+ varchar columns; no migration value. |
| DROP_LEGACY | `deliverables_load` | Dirty flat import (`Notes (2)`, `MyUnknownColumn`, `PMDA Comments`); twin of `aplctn_mngmt_raw_cleaned`. |
| DROP_LEGACY | `mdcd_dlvrbl_prd_strt_dt_temp` | Explicit `_temp` scratch table; `dlvrbl_prd_strt_dt` already lives on base `mdcd_dlvrbl`. |

## Sign-off

- Reviewer: __________________
- Date: __________________
- Notes: __________________

## Re-evaluation triggers

Add a table back to the load if:

1. The new app spec adds a feature whose data lives in one of the dropped tables.
2. SME identifies historical data in a `_bkup` table that does not exist in the live table.
3. Audit / compliance requirement covers something currently in the email or operational logs.
