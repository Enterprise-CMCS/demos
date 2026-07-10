/*
 * Purpose:    Amendment load accounting: held-back amendments, dropped legacy signature levels, synthesized names, and the status-derived current_phase tally for SME review.
 * Inputs:     stg.amendment_resolved; demos_app.demonstration; mysql_raw.crosswalk_amendment_status
 * Outputs:    migration._parity_amendment_held; migration._parity_amendment_held_missing_field; migration._parity_amendment_signature_dropped; migration._parity_amendment_name_synthesized; migration._parity_amendment_phase_derived; migration._parity_amendment_unmapped_status
 * Invariants: the accounting views (held/held_missing_field/signature_dropped/name_synthesized/phase_derived) back the NON-GATING check 19 (always GREEN, per-row to reports/orphans/amendment_*.csv); _parity_amendment_unmapped_status backs a FAIL-CLOSED guard (RED when non-empty) surfacing staged amendments with a loaded parent whose status_cd the loader's inner crosswalk JOIN would silently drop; conditional-DDL guard via to_regclass so it is a clean no-op before the staging view, crosswalk, and demonstration table exist; idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py (non-gating check 19); sql/20_app/35_amendment.sql
 *
 * Parity check 19: amendment load accounting (non-gating informational logs).
 *
 * The amendment loader (sql/20_app/35_amendment.sql) makes two deliberate,
 * lossy-by-design choices that must be visible at the gate rather than silently
 * trusted:
 *   1. demonstration_id is NOT NULL and points at a LOADED demonstration, so an
 *      amendment whose only parent is a pending demo (not migrated) -- or whose
 *      approved parent was itself held back -- is excluded.
 *   2. amendment.signature_level_id is restricted to NULL/OA/OCD (DEMOS
 *      AMENDMENT_SIGNATURE_LEVELS + amendment_signature_level_check), so a legacy
 *      OGD/DD-coded amendment signature is dropped to NULL.
 *   3. amendment.name is required non-empty, but the source name is NULL/empty for
 *      a meaningful subset; the loader synthesizes '<parent demonstration name>
 *      Amendment (effective DATE)' (with fallbacks), so each synthesized name is
 *      surfaced for SME review/replacement.
 * Plus current_phase_id is a status-derived approximation (no source column);
 * the per-phase tally lets an SME ratify the mapping.
 *
 * NON-GATING: the parity check that reads these views always returns GREEN and
 * writes any rows per-row to reports/orphans/amendment_*.csv. These are review
 * signals, not build failures.
 *
 * FAIL-CLOSED companion (_parity_amendment_unmapped_status): the loader joins
 * stg.amendment_resolved to crosswalk_amendment_status with an INNER join on
 * status_cd, so a staged amendment whose status_cd is NULL or absent from the
 * crosswalk is dropped from the load with no error and no held-row log -- and
 * every accounting view above shares that inner join, so the drop is invisible
 * there too. This view captures each such amendment that HAS a loaded parent
 * demonstration (i.e. would otherwise load), so the reading check (parity.py)
 * can fail the gate RED rather than let those rows silently vanish. The
 * parent-not-loaded case is already covered by _parity_amendment_held, so this
 * view requires a loaded parent to avoid double-counting.
 *
 * Conditional DDL: guarded with to_regclass so it is a clean no-op before the
 * staging view, crosswalk, and demonstration table exist; CREATE OR REPLACE
 * keeps re-apply idempotent.
 */
SET search_path TO migration, demos_app, stg, mysql_raw, public;

DO $$
BEGIN
  IF to_regclass('stg.amendment_resolved') IS NULL OR to_regclass('demos_app.demonstration') IS NULL OR to_regclass('mysql_raw.crosswalk_amendment_status') IS NULL THEN
    RAISE NOTICE 'parity amendment_load: staging/crosswalk/demonstration not all present; views not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_amendment_held AS
    SELECT
      r.new_uuid                                       AS amendment_uuid,
      r.demo_uuid                                      AS demo_uuid,
      r.name                                           AS name,
      CASE
        WHEN r.demo_uuid IS NULL THEN 'pending-only or unmapped parent'
        ELSE 'approved parent held back'
      END                                              AS reason
    FROM stg.amendment_resolved r
    WHERE NOT EXISTS (
      SELECT 1 FROM demos_app.demonstration d WHERE d.id = r.demo_uuid
    );
  $v$;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_amendment_held_missing_field AS
    SELECT
      r.new_uuid                                       AS amendment_uuid,
      r.demo_uuid                                      AS demo_uuid,
      r.name                                           AS name,
      cw.demos_text_id                                 AS status_id,
      (r.effective_date IS NULL)                       AS missing_effective_date,
      (r.signature_cd IS DISTINCT FROM 1
        AND r.signature_cd IS DISTINCT FROM 2)         AS missing_signature
    FROM stg.amendment_resolved r
    JOIN mysql_raw.crosswalk_amendment_status cw ON cw.legacy_int_cd = r.status_cd
    JOIN demos_app.demonstration d               ON d.id = r.demo_uuid
    WHERE cw.demos_text_id = 'Approved'
      AND (r.effective_date IS NULL
        OR (r.signature_cd IS DISTINCT FROM 1 AND r.signature_cd IS DISTINCT FROM 2));
  $v$;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_amendment_signature_dropped AS
    SELECT
      r.new_uuid                                       AS amendment_uuid,
      r.name                                           AS name,
      r.signature_cd                                   AS signature_cd
    FROM stg.amendment_resolved r
    WHERE r.signature_cd IS NOT NULL
      AND r.signature_cd NOT IN (1, 2);
  $v$;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_amendment_name_synthesized AS
    SELECT
      r.new_uuid                                       AS amendment_uuid,
      r.demo_uuid                                      AS demo_uuid,
      d.name                                           AS parent_demonstration_name,
      r.effective_date                                 AS effective_date,
      COALESCE(
        NULLIF(btrim(d.name), '')
          || ' Amendment'
          || CASE WHEN r.effective_date IS NOT NULL
               THEN ' (effective ' || to_char(r.effective_date, 'YYYY-MM-DD') || ')'
               ELSE '' END,
        'Amendment'
      )                                                AS synthesized_name
    FROM stg.amendment_resolved r
    JOIN mysql_raw.crosswalk_amendment_status cw ON cw.legacy_int_cd = r.status_cd
    JOIN demos_app.demonstration d               ON d.id = r.demo_uuid
    WHERE NULLIF(btrim(r.name), '') IS NULL
      AND NOT (cw.demos_text_id = 'Approved'
        AND (r.effective_date IS NULL
          OR (r.signature_cd IS DISTINCT FROM 1 AND r.signature_cd IS DISTINCT FROM 2)));
  $v$;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_amendment_phase_derived AS
    SELECT
      cw.demos_text_id                                 AS status_id,
      CASE cw.demos_text_id
        WHEN 'Approved'     THEN 'Approval Summary'
        WHEN 'Under Review' THEN 'Review'
        ELSE 'Concept'
      END                                              AS derived_phase,
      count(*)                                         AS n
    FROM stg.amendment_resolved r
    JOIN mysql_raw.crosswalk_amendment_status cw ON cw.legacy_int_cd = r.status_cd
    JOIN demos_app.demonstration d               ON d.id = r.demo_uuid
    GROUP BY 1, 2;
  $v$;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_amendment_unmapped_status AS
    SELECT
      r.new_uuid                                       AS amendment_uuid,
      r.demo_uuid                                      AS demo_uuid,
      r.name                                           AS name,
      r.status_cd                                      AS status_cd
    FROM stg.amendment_resolved r
    JOIN demos_app.demonstration d                    ON d.id = r.demo_uuid
    LEFT JOIN mysql_raw.crosswalk_amendment_status cw ON cw.legacy_int_cd = r.status_cd
    WHERE cw.legacy_int_cd IS NULL;
  $v$;
END
$$;

