/*
 * Purpose:    Load the demos_app.application anchor + demos_app.amendment from stg.amendment_resolved, deriving status, phase and signature level.
 * Inputs:     stg.amendment_resolved; mysql_raw.crosswalk_amendment_status; demos_app.demonstration (parent JOIN).
 * Outputs:    demos_app.application, demos_app.amendment
 * Invariants: runs inside the deferred-constraint build_app txn; FKs dropped during build, re-validated in the constraints phase; guarded inert until stg.amendment_resolved exists; demonstration_id is NOT NULL so a pending-only or held-back parent cascades the amendment out (held-back, non-gating, logged to migration._parity_amendment_held); mirrors check_amendment_non_null_fields_when_approved by holding back Approved amendments with a NULL effective_date/signature (non-gating, logged to migration._parity_amendment_held_missing_field), exactly as the demonstration loader holds back Approved demos missing required fields; idempotent via NOT EXISTS + ON CONFLICT (id) DO NOTHING.
 * Refs:       docs/specs/pmda-cross-cutting-derivation-spec.md, reports/narrative/pending_approved_decisions.md, sql/20_app/30_demonstration.sql
 *
 * App load: demos_app.application (anchor) + demos_app.amendment from the
 * PMDA amendments resolved in stg.amendment_resolved (10_stg/30).
 *
 * An amendment IS-A application sharing one UUID (composite FK
 * amendment(id, application_type_id) -> application(id, application_type_id)),
 * exactly like the demonstration loader (30_demonstration.sql). Both inserts run
 * in the single deferred-constraint build_app transaction; FKs are dropped during
 * build and re-validated in the constraints phase, so ids are set directly here.
 *
 * Column derivations (docs/specs/pmda-cross-cutting-derivation-spec.md;
 * reports/narrative/pending_approved_decisions.md workflow 3):
 *   application_type_id  constant 'Amendment'
 *   demonstration_id     parent approved demo UUID (stg.amendment_resolved.demo_uuid),
 *                        required NOT NULL -> JOIN demos_app.demonstration so a
 *                        pending-only or held-back parent cascades the amendment out
 *   demonstration_status_id  parent demo status_id (d.status_id from the JOIN);
 *                        satisfies the composite FK
 *                        amendment(demonstration_id, demonstration_status_id) ->
 *                        demonstration(id, status_id) and the FK to
 *                        approved_application_status_limit (added by Prisma
 *                        migration 20260624205341)
 *   name                 source name (btrim) when present; else synthesized as
 *                        '<parent demonstration name> Amendment (effective DATE)'
 *                        -> '<parent name> Amendment' (no effective date)
 *                        -> 'Amendment' (no parent name). DEMOS requires a
 *                        non-empty name (user-entered, no auto-gen) but the source
 *                        is NULL/empty for a meaningful subset; synthesized names
 *                        are logged non-gating to
 *                        migration._parity_amendment_name_synthesized (99_parity/52)
 *   status_id            crosswalk_amendment_status(mdcd_demo_amndmt_stus_cd)
 *   current_phase_id     status-derived (no source column): Approved->'Approval Summary',
 *                        Under Review->'Review', Withdrawn/Denied->'Concept'
 *                        (proposed; SME-ratify; logged by 99_parity/52)
 *   clearance_level_id   omitted -> table DEFAULT 'CMS (OSORA)'
 *   signature_level_id   OA->'OA', OCD->'OCD', else NULL (OGD/DD not valid amendment
 *                        signatures per DEMOS AMENDMENT_SIGNATURE_LEVELS + the
 *                        amendment_signature_level_check; dropped codes logged)
 *   effective_date       amndmt_prd_from_dt
 *   created/updated_at   creatd_dt (no updated-at column on the source)
 *   status_updated_at    = updated_at (mirrors the DEMOS backfill convention)
 *
 * Held-back (non-gating, logged to reports/orphans/ by sql/99_parity/52 +
 * parity check 19): amendments whose parent demonstration is not loaded, and
 * Approved amendments with a NULL effective_date or NULL signature_level_id
 * (which check_amendment_non_null_fields_when_approved would reject) -- the
 * loader drops these from the load set rather than fail the whole build_app txn,
 * mirroring 30_demonstration.sql. The derivation, hold-back guard and both
 * inserts share one pass via a temp table (pg_temp._amd_load).
 *
 * Idempotent: NOT EXISTS + ON CONFLICT (id) DO NOTHING keep re-apply a no-op.
 * Guarded: a clean no-op before stg.amendment_resolved exists (e.g. the
 * demos_app-only idempotency harness), mirroring 30_demonstration.sql.
 */
SET search_path TO demos_app, stg, migration, mysql_raw, public;

DO $$
DECLARE
  held int;
  held_missing int;
  synthesized int;
BEGIN
  IF to_regclass('stg.amendment_resolved') IS NULL THEN
    RAISE NOTICE 'skip amendment load: stg.amendment_resolved not built yet';
    RETURN;
  END IF;
  -- Resolve each loadable amendment (status mapped + parent demonstration
  -- loaded) into the target column set once, on a temp table, so the
  -- application-anchor insert, the amendment insert, and the fail-closed
  -- hold-back guard all share a single derivation. ON COMMIT DROP + a defensive
  -- pre-DROP keep re-apply clean in either autocommit or one-txn mode.
  DROP TABLE IF EXISTS pg_temp._amd_load;
  CREATE TEMP TABLE _amd_load ON COMMIT DROP AS
  SELECT
    r.new_uuid                                        AS new_uuid,
    r.demo_uuid                                       AS demo_uuid,
    d.status_id                                       AS demo_status_id,
    -- name synthesis (RED-5): DEMOS requires a non-empty amendment.name, but the
    -- source name is NULL/empty for a meaningful subset of amendments. Keep the
    -- source name when present; else synthesize from the loaded parent + effective
    -- date. NULLIF(btrim(d.name),'') || ... is NULL when the parent name is empty,
    -- so COALESCE falls through to the constant last resort.
    COALESCE(
      NULLIF(btrim(r.name), ''),
      NULLIF(btrim(d.name), '')
        || ' Amendment'
        || CASE WHEN r.effective_date IS NOT NULL
             THEN ' (effective ' || to_char(r.effective_date, 'YYYY-MM-DD') || ')'
             ELSE '' END,
      'Amendment'
    )                                                 AS name,
    (NULLIF(btrim(r.name), '') IS NULL)               AS name_synthesized,
    r.description                                     AS description,
    r.effective_date                                  AS effective_date,
    cw.demos_text_id                                  AS status_id,
    CASE cw.demos_text_id
    WHEN 'Approved' THEN
      'Approval Summary'
    WHEN 'Under Review' THEN
      'Review'
    ELSE
      'Concept'
    END                                               AS current_phase_id,
    CASE r.signature_cd
    WHEN 1 THEN
      'OA'
    WHEN 2 THEN
      'OCD'
    ELSE
      NULL
    END                                               AS signature_level_id,
    r.created_at                                      AS created_at,
    r.updated_at                                      AS updated_at
  FROM
    stg.amendment_resolved r
    JOIN mysql_raw.crosswalk_amendment_status cw ON cw.legacy_int_cd = r.status_cd
    JOIN demos_app.demonstration d ON d.id = r.demo_uuid;
  -- Fail-closed hold-back mirroring check_amendment_non_null_fields_when_approved
  -- (as the demonstration loader mirrors its own Approved CHECK): an Approved
  -- amendment with a NULL effective_date or NULL signature_level_id would violate
  -- the DEMOS CHECK, so drop it from the load set (logged per-row for SME via
  -- migration._parity_amendment_held_missing_field) rather than fail the txn.
  WITH removed AS (
    DELETE FROM _amd_load
    WHERE status_id = 'Approved'
      AND (effective_date IS NULL OR signature_level_id IS NULL)
    RETURNING 1
  )
  SELECT count(*) INTO held_missing FROM removed;
  INSERT INTO demos_app.application(id, application_type_id)
  SELECT
    l.new_uuid,
    'Amendment'
  FROM
    _amd_load l
  WHERE
    NOT EXISTS (
      SELECT
        1
      FROM
        demos_app.application ex
      WHERE
        ex.id = l.new_uuid)
  ON CONFLICT (id)
    DO NOTHING;
  INSERT INTO demos_app.amendment(id, application_type_id, demonstration_id, demonstration_status_id, name, description, effective_date, status_id, current_phase_id, signature_level_id, created_at, updated_at, status_updated_at)
  SELECT
    l.new_uuid,
    'Amendment',
    l.demo_uuid,
    l.demo_status_id,
    l.name,
    l.description,
    l.effective_date,
    l.status_id,
    l.current_phase_id,
    l.signature_level_id,
    l.created_at,
    l.updated_at,
    l.updated_at
  FROM
    _amd_load l
  WHERE
    NOT EXISTS (
      SELECT
        1
      FROM
        demos_app.amendment ex
      WHERE
        ex.id = l.new_uuid)
  ON CONFLICT (id)
    DO NOTHING;
  -- Held back: a valid amendment whose parent demonstration is not loaded
  -- (pending-only parent, or an approved parent that was itself held back).
  SELECT
    count(*) INTO held
  FROM
    stg.amendment_resolved r
  WHERE
    NOT EXISTS (
      SELECT
        1
      FROM
        demos_app.demonstration d
      WHERE
        d.id = r.demo_uuid);
  IF held > 0 THEN
    RAISE NOTICE 'amendment load: % amendment(s) held back (parent demonstration not loaded); see migration._parity_amendment_held', held;
  END IF;
  IF held_missing > 0 THEN
    RAISE NOTICE 'amendment load: % Approved amendment(s) held back for a missing required field (effective_date/signature); see migration._parity_amendment_held_missing_field', held_missing;
  END IF;
  SELECT count(*) INTO synthesized FROM _amd_load WHERE name_synthesized;
  IF synthesized > 0 THEN
    RAISE NOTICE 'amendment load: % amendment(s) loaded with a synthesized name (source name null/empty); see migration._parity_amendment_name_synthesized', synthesized;
  END IF;
END
$$;

