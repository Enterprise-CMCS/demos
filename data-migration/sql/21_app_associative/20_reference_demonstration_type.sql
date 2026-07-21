/*
 * Purpose:    Fold PMDA reference materials carrying a demonstration-type code into demos_app.reference_demonstration_type rows.
 * Inputs:     mysql_raw.rfrnc_matl; mysql_raw.mdcd_demo_type_rfrnc; migration._id_map_rfrnc_matl; demos_app.tag, demos_app.demonstration_type_tag_type_limit, demos_app.reference.
 * Outputs:    demos_app.reference_demonstration_type
 * Invariants: runs inside the deferred-constraint build_app txn; FKs dropped during build, re-validated in the constraints phase; guarded inert unless demos_app.reference has rows, demos_app.tag is seeded, migration._id_map_rfrnc_matl is populated, and both source tables are loaded (each a separate IF so an absent relation is never planned); code -> tag resolution is data-backed via mdcd_demo_type_rfrnc, so unseeded codes '0'/'OTHR' fall out of the JOIN and are reported; idempotent via ON CONFLICT (reference_id, demonstration_type_tag_name_id, demonstration_type_tag_type_id) DO NOTHING.
 * Refs:       reports/crosswalks/proposed/archive/demonstration_type.proposed.csv, docs/sme/reference-pgm-dtl-tag-mapping.adoc
 *
 * App load (associative): demos_app.reference_demonstration_type.
 *
 * The reference analog of the tag-pivot fold (see 10_*.sql). PMDA's reference
 * materials (mysql_raw.rfrnc_matl) carry a single demonstration-type code in
 * mdcd_demo_type_cd. Each reference row that carries a demonstration-type code
 * folds into one row of this associative table, keyed by
 * (reference_id, demonstration_type_tag_name_id, demonstration_type_tag_type_id).
 *
 * Code -> tag resolution is data-backed, nothing hardcoded: rfrnc_matl is
 * joined to its own source lookup mysql_raw.mdcd_demo_type_rfrnc to get the
 * human-readable mdcd_demo_type_name, which IS the demos_app.tag_name.id value
 * (verified: 61/63 codes are identity matches; see
 * reports/crosswalks/proposed/archive/demonstration_type.proposed.csv). The two codes
 * that are NOT seeded demonstration-type tags -- '0' (Not Applicable) and
 * 'OTHR' (Other) -- naturally fall out of the JOIN and are reported as skipped.
 *
 * NOTE: the demonstration-type vocabulary lives in the 'Demonstration Type'
 * tag_type (demos_app.demonstration_type_tag_type_limit), so the correct target
 * is reference_demonstration_type -- NOT reference_tag_assignment, which is
 * restricted to the 'Reference' tag_type (only one such tag is seeded, the FAQ
 * tag). reference_demonstration_type reuses the exact 61-tag vocabulary already
 * resolved by 10_demonstration_type_tag_assignment.sql.
 *
 * GUARDED / inert until its prerequisites exist, like the tag-assignment loader.
 * The whole load skips with a NOTICE unless ALL of:
 *   1. demos_app.reference has rows (the FK parent is loaded), and
 *   2. demos_app.tag has rows (the tag vocabulary is seeded), and
 *   3. migration._id_map_rfrnc_matl is populated (rfrnc_matl_id -> reference
 *      uuid; the table itself is created empty in
 *      sql/05_id_maps/14_rfrnc_matl.sql), and
 *   4. mysql_raw.rfrnc_matl and mysql_raw.mdcd_demo_type_rfrnc are loaded.
 * The reference loader that populates the id-map and demos_app.reference is a
 * separate workstream (rfrnc_matl -> demos_app.reference needs an owner
 * user/person-type FK); until the id-map has rows this loader inserts nothing.
 *
 * Idempotent: ON CONFLICT (reference_id, demonstration_type_tag_name_id,
 * demonstration_type_tag_type_id) DO NOTHING.
 * See docs/sme/reference-pgm-dtl-tag-mapping.adoc and the source/target map.
 */
SET search_path TO demos_app, mysql_raw, migration, public;

DO $$
DECLARE
  loaded_ct bigint := 0;
  skipped_ct bigint := 0;
BEGIN
  -- Prerequisite guards: stay inert until the parent + vocabulary + id-map +
  -- source tables exist. Each existence check is a separate IF so a table
  -- reference is never planned when the relation is absent.
  IF to_regclass('demos_app.reference') IS NULL THEN
    RAISE NOTICE 'skip reference-demo-type load: demos_app.reference absent';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      demos_app.reference) THEN
  RAISE NOTICE 'skip reference-demo-type load: demos_app.reference not loaded yet';
  RETURN;
END IF;
  IF to_regclass('demos_app.tag') IS NULL THEN
    RAISE NOTICE 'skip reference-demo-type load: demos_app.tag absent';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      demos_app.tag) THEN
  RAISE NOTICE 'skip reference-demo-type load: demos_app.tag vocabulary not seeded yet';
  RETURN;
END IF;
  IF to_regclass('migration._id_map_rfrnc_matl') IS NULL THEN
    RAISE NOTICE 'skip reference-demo-type load: migration._id_map_rfrnc_matl absent';
    RETURN;
  END IF;
  IF to_regclass('mysql_raw.rfrnc_matl') IS NULL THEN
    RAISE NOTICE 'skip reference-demo-type load: mysql_raw.rfrnc_matl absent';
    RETURN;
  END IF;
  IF to_regclass('mysql_raw.mdcd_demo_type_rfrnc') IS NULL THEN
    RAISE NOTICE 'skip reference-demo-type load: mysql_raw.mdcd_demo_type_rfrnc absent';
    RETURN;
  END IF;
  -- Count in-scope reference rows whose demonstration-type code does NOT
  -- resolve to a seeded demonstration-type tag (e.g. '0'/Not Applicable,
  -- 'OTHR'/Other). These are reported, not loaded.
  SELECT
    count(*) INTO skipped_ct
  FROM
    mysql_raw.rfrnc_matl r
    JOIN migration._id_map_rfrnc_matl idm ON idm.legacy_int_id = r.rfrnc_matl_id
    LEFT JOIN mysql_raw.mdcd_demo_type_rfrnc dt ON dt.mdcd_demo_type_cd = r.mdcd_demo_type_cd
    LEFT JOIN demos_app.tag tg ON tg.tag_name_id = dt.mdcd_demo_type_name
    LEFT JOIN demos_app.demonstration_type_tag_type_limit lim ON lim.id = tg.tag_type_id
  WHERE
    COALESCE(r.dltd_ind, 0) = 0
    AND lim.id IS NULL;
  INSERT INTO demos_app.reference_demonstration_type(reference_id, demonstration_type_tag_name_id, demonstration_type_tag_type_id)
  SELECT
    idm.new_uuid,
    tg.tag_name_id,
    tg.tag_type_id
  FROM
    mysql_raw.rfrnc_matl r
    JOIN migration._id_map_rfrnc_matl idm ON idm.legacy_int_id = r.rfrnc_matl_id
    JOIN mysql_raw.mdcd_demo_type_rfrnc dt ON dt.mdcd_demo_type_cd = r.mdcd_demo_type_cd
    JOIN demos_app.tag tg ON tg.tag_name_id = dt.mdcd_demo_type_name
    JOIN demos_app.demonstration_type_tag_type_limit lim ON lim.id = tg.tag_type_id
  WHERE
    COALESCE(r.dltd_ind, 0) = 0
  ON CONFLICT (reference_id,
    demonstration_type_tag_name_id,
    demonstration_type_tag_type_id)
    DO NOTHING;
  GET DIAGNOSTICS loaded_ct = ROW_COUNT;
  RAISE NOTICE 'reference-demo-type load: % row(s) inserted, % source row(s) skipped for unresolved demo-type code', loaded_ct, skipped_ct;
END
$$;

