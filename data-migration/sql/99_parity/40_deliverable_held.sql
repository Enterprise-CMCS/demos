/*
 * Purpose:    Durable per-row log of deliverables the loader held back from the load and why (non-Approved parent, N/A/unmapped status, unresolvable due date, empty name, unmigrated creator, state-user owner, or -- defensively -- an unmapped deliverable_type code).
 * Inputs:     stg.deliverable_resolved; mysql_raw.crosswalk_deliverable_status; demos_app.demonstration; demos_app.deliverable
 * Outputs:    migration._parity_deliverable_held
 * Invariants: NON-GATING (surfaces the count + per-row rows, does not RED the gate); conditional-DDL guard (created only when stg.deliverable_resolved + crosswalk_deliverable_status are present, so the app-layers idempotency harness applies it as a no-op); idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py (non-gating check 17); sql/20_app/40_deliverable.sql; reports/crosswalks/proposed/deliverable_type_bn_routing.md; complements 41_deliverable_completeness.sql
 *
 * Parity check 17: deliverables held back from the load (durable per-row log
 * for SME review).
 *
 * The loader (sql/20_app/40_deliverable.sql) holds back every deliverable it
 * cannot place rather than failing the build. The reasons are computed from the
 * loader inputs so an SME can see exactly why each held-back deliverable did
 * not load: an unmapped deliverable_type code (fail-closed; the type crosswalk
 * is complete, so this normally never fires), a non-Approved parent, an N/A
 * status deliberately excluded (code 0, null_ok), an unmapped status code, an
 * unresolvable due date, an empty name, an unmigrated creator, or a state-user
 * owner anomaly. The deliverable_type reason is conditional on the
 * crosswalk_deliverable_type join (previously it was hardcoded while the type
 * crosswalk was unsigned); it preserves the completeness invariant that every
 * non-loaded resolved deliverable carries a reason.
 *
 * Per the cutover scope decision the parity check that reads this view is
 * NON-GATING (it surfaces the count + per-row rows; see
 * migration/phases/parity.py). The completeness check
 * (41_deliverable_completeness.sql) excludes these held-back rows so a
 * deliberate hold-back does not also trip the gating check RED.
 *
 * Conditional DDL: the view reads stg.deliverable_resolved plus
 * crosswalk_deliverable_status, which exist only in the full pipeline and never
 * in the app-layers idempotency harness. Each input is guarded so the view is
 * created only when present; the harness applies this file as a clean no-op,
 * and re-apply is idempotent via CREATE OR REPLACE.
 */
SET search_path TO migration, stg, mysql_raw, demos_app, public;

DO $$
BEGIN
  IF to_regclass('stg.deliverable_resolved') IS NULL THEN
    RAISE NOTICE 'parity deliverable_held: stg.deliverable_resolved absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('mysql_raw.crosswalk_deliverable_status') IS NULL THEN
    RAISE NOTICE 'parity deliverable_held: mysql_raw.crosswalk_deliverable_status absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('mysql_raw.crosswalk_deliverable_type') IS NULL THEN
    RAISE NOTICE 'parity deliverable_held: mysql_raw.crosswalk_deliverable_type absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_deliverable_held AS
    SELECT
      r.new_uuid         AS deliverable_id,
      r.legacy_id        AS legacy_id,
      r.demonstration_id AS demonstration_id,
      r.status_cd        AS status_cd,
      concat_ws('; ',
        CASE WHEN xtype.demos_text_id IS NULL
             THEN 'deliverable_type code unmapped (fail-closed)' END,
        CASE WHEN dm.id IS NULL
             THEN 'parent demonstration not loaded as Approved' END,
        CASE WHEN COALESCE(cw.null_ok, FALSE)
             THEN 'N/A deliverable status (code 0) -- excluded per SME' END,
        CASE WHEN cw.status_id IS NULL AND NOT COALESCE(cw.null_ok, FALSE)
             THEN 'deliverable status code unmapped (fail-closed)' END,
        CASE WHEN r.due_date IS NULL
             THEN 'unresolvable due_date' END,
        CASE WHEN r.name = ''
             THEN 'empty deliverable name' END,
        CASE WHEN r.cms_owner_user_id IS NULL
             THEN 'creator did not migrate (no cms_owner)' END,
        CASE WHEN r.cms_owner_user_id IS NOT NULL
                  AND (r.cms_owner_person_type_id IS NULL
                       OR r.cms_owner_person_type_id NOT IN ('demos-admin', 'demos-cms-user'))
             THEN 'owner is not a CMS user (anomaly)' END
      )                  AS reason
    FROM stg.deliverable_resolved r
    LEFT JOIN demos_app.demonstration dm
      ON dm.id = r.demonstration_id AND dm.status_id = 'Approved'
    LEFT JOIN mysql_raw.crosswalk_deliverable_status cw
      ON cw.legacy_int_cd = r.status_cd
    LEFT JOIN mysql_raw.crosswalk_deliverable_type xtype
      ON xtype.legacy_int_cd = r.deliverable_type_cd
    WHERE NOT EXISTS (
            SELECT 1 FROM demos_app.deliverable d WHERE d.id = r.new_uuid
          );
  $v$;
END
$$;

