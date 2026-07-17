/*
 * Purpose: Create the (empty) migration._id_map_rfrnc_matl table mapping legacy rfrnc_matl.rfrnc_matl_id to a minted DEMOS uuid (the canonical demos_app.reference.id); populated later by the reference loader. Idempotent.
 * Refs:    docs/developer/reference-id-maps.adoc, sql/21_app_associative/20_reference_demonstration_type.sql
 *
 * Id map: legacy mysql_raw.rfrnc_matl.rfrnc_matl_id (int) -> DEMOS uuid.
 * See docs/developer/reference-id-maps.adoc.
 *
 * This file CREATES the (empty) map only. Population is deferred to the
 * reference loader workstream (not yet on main): rfrnc_matl ->
 * demos_app.reference needs an owner user/person-type FK, and the choice of
 * which rfrnc_matl rows become reference rows (version/crnt_ind/is_archived
 * scope) is that loader's decision, not the CREATE's. Creating the table in 05
 * keeps it available by name to any stg/app transform that JOINs the map.
 *
 * The minted new_uuid is the canonical demos_app.reference.id: the future
 * reference loader reuses idm.new_uuid as reference.id, and
 * sql/21_app_associative/20_reference_demonstration_type.sql JOINs this map to
 * fold rfrnc_matl's mdcd_demo_type_cd into reference_demonstration_type. Until
 * the map is populated that loader stays inert (0 rows).
 */
CREATE TABLE IF NOT EXISTS migration._id_map_rfrnc_matl(
  legacy_int_id bigint PRIMARY KEY,
  new_uuid uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  _created_at timestamptz NOT NULL DEFAULT now()
);

