/*
 * Purpose: Create the (empty) migration._id_map_mdcd_dlvrbl_fil_doc table mapping legacy budget-neutrality workbook file ids to a minted DEMOS uuid (reused as the workbook id and parity-oracle key); populated later in 10_stg. Idempotent.
 * Refs:    docs/developer/reference-id-maps.adoc, docs/spec/canonical-spec.adoc (workstream I), sql/01_ddl_supplements/10_bn_workbook_detail.sql
 *
 * Id map: legacy mysql_raw.mdcd_dlvrbl_fil_doc.mdcd_dlvrbl_fil_doc_id (int)
 * -> DEMOS uuid, for budget-neutrality workbook files only
 * (bdgt_ntrlty_fil_ind = 1). One BN file == one
 * demos_app.budget_neutrality_workbook row, so this uuid is reused as both
 * that workbook's id (in the future sql/20_app loader) and
 * migration.bn_workbook_detail.workbook_id (the parity-oracle key). See
 * docs/spec/canonical-spec.adoc workstream I and
 * sql/01_ddl_supplements/10_bn_workbook_detail.sql.
 *
 * CREATE-only here. Population lives in
 * sql/10_stg/60_budget_neutrality.sql, which filters to PMDA-valid demos
 * via stg._valid_demo_ids (a 10_stg view); the build applies 05_id_maps
 * before 10_stg, so the INSERT cannot run here. Creating the table in 05
 * keeps it available by name to any stg/app transform that JOINs the map.
 * See docs/developer/reference-id-maps.adoc.
 */
CREATE TABLE IF NOT EXISTS migration._id_map_mdcd_dlvrbl_fil_doc(
  legacy_int_id bigint PRIMARY KEY,
  new_uuid uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  _created_at timestamptz NOT NULL DEFAULT now()
);

