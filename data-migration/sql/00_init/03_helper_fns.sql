/*
 * Purpose: Define the cross-layer migration helper functions (lookup_uuid, assert_zero, crosswalk) that stg and app transforms call into.
 * Refs:    -
 *
 * Helper functions used across stg and app transforms.
 *
 * Three small utilities are defined here; they have to exist before
 * any sql/05_id_maps, sql/10_stg or sql/20_app file that calls
 * into them.
 *
 *   migration.lookup_uuid(table, legacy_id)
 *     Translate a MySQL integer PK into the DEMOS UUID by reading the
 *     matching `migration._id_map_<table>` row. STABLE because the
 *     id_map tables are append-only within a single build.
 *
 *   migration.assert_zero(label, count)
 *     Cheap inline guardrail for stg/app transforms: raise if `count`
 *     is non-zero. Used to abort a build when a parity sub-query
 *     returns unexpected rows.
 *
 *   migration.crosswalk(rfrnc, legacy_cd)
 *     Translate a MySQL reference-table code into the canonical DEMOS
 *     text id via `mysql_raw.crosswalk_<rfrnc>`. Raises when the legacy
 *     code is non-null but unmapped so SMEs notice missing crosswalk
 *     rows instead of silently dropping data.
 */
CREATE OR REPLACE FUNCTION migration.lookup_uuid(p_table text, p_legacy_id bigint)
  RETURNS uuid
  LANGUAGE plpgsql
  STABLE
  AS $$
DECLARE
  v_uuid uuid;
  v_sql text;
BEGIN
  IF p_legacy_id IS NULL THEN
    RETURN NULL;
  END IF;
  v_sql := format('SELECT new_uuid FROM migration._id_map_%I WHERE legacy_int_id = $1', p_table);
  EXECUTE v_sql INTO v_uuid
  USING p_legacy_id;
  RETURN v_uuid;
END
$$;

CREATE OR REPLACE FUNCTION migration.assert_zero(p_label text, p_count bigint)
  RETURNS void
  LANGUAGE plpgsql
  AS $$
BEGIN
  IF p_count <> 0 THEN
    RAISE EXCEPTION 'assertion % failed: expected 0, got %', p_label, p_count;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION migration.crosswalk(p_rfrnc text, p_legacy_cd int)
  RETURNS text
  LANGUAGE plpgsql
  STABLE
  AS $$
DECLARE
  v_id text;
  v_sql text;
BEGIN
  IF p_legacy_cd IS NULL THEN
    RETURN NULL;
  END IF;
  v_sql := format('SELECT demos_text_id FROM mysql_raw.crosswalk_%I WHERE legacy_int_cd = $1', p_rfrnc);
  EXECUTE v_sql INTO v_id
  USING p_legacy_cd;
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'crosswalk % missing for legacy code %', p_rfrnc, p_legacy_cd;
  END IF;
  RETURN v_id;
END
$$;

