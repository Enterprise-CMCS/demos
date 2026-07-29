/*
 * Purpose:    Asserts every loaded deliverable has exactly the synthesized action chain its status calls for -- no missing hop, no extra hop, and no chain that contradicts the deliverable's own status or due date.
 * Inputs:     demos_app.deliverable; demos_app.deliverable_action; migration.deliverable_action_chain; migration._parity_deliverable_action_held
 * Outputs:    migration._parity_deliverable_action_completeness
 * Invariants: Non-empty -> RED; conditional-DDL guard (created only when the deliverable_action table and the chain seed are present, so the app-layers idempotency harness applies it as a no-op); idempotent via CREATE OR REPLACE; a deliverable recorded as held is exempt (it is expected to have no actions).
 * Refs:       migration/phases/parity.py "Deliverable action completeness" CheckResult; sql/23_app_derived/60_deliverable_action.sql, sql/02_seeds_static/30_deliverable_action_chain.sql, sql/99_parity/63_deliverable_action_held.sql
 *
 * Parity check: deliverable_action synthesis completeness.
 *
 * The action rows are synthesized, not migrated, so the usual source-to-target
 * row comparison does not apply. What can still be asserted is that the
 * synthesis did exactly what the seed says it should:
 *
 *   1. hop count      a loaded deliverable has one action per seeded hop for
 *                     its status -- neither fewer (a lost hop) nor more (a
 *                     double apply that ON CONFLICT failed to absorb)
 *   2. terminal state the chain's last hop lands on the deliverable's own
 *                     status_id, so the timeline cannot disagree with the
 *                     status DEMOS displays
 *   3. ordering       action_timestamp strictly increases across the chain; a
 *                     tie or an inversion would render as a timeline that
 *                     travels backwards
 *   4. due date       every hop carries the deliverable's due_date on both
 *                     sides, which is what makes block_unpermitted_due_date_changes
 *                     satisfiable for these note-free types
 *
 * A deliverable listed in migration._parity_deliverable_action_held is exempt:
 * it is recorded as having no chain, and 63_* reports it separately. That keeps
 * this check about synthesis defects rather than re-reporting seed gaps.
 *
 * Consumed by migration/phases/parity.py. Non-empty -> RED.
 *
 * Conditional DDL: guarded so the app-layers idempotency harness, which has no
 * chain seed, applies this file as a clean no-op.
 */
SET search_path TO migration, demos_app, public;

DO $$
BEGIN
  IF to_regclass('demos_app.deliverable_action') IS NULL OR to_regclass('migration.deliverable_action_chain') IS NULL OR to_regclass('migration._parity_deliverable_action_held') IS NULL THEN
    RAISE NOTICE 'parity deliverable_action_completeness: deliverable_action, chain seed, or held log absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_deliverable_action_completeness AS
    WITH expected AS (
      SELECT d.id            AS deliverable_id,
             d.status_id     AS status_id,
             d.due_date      AS due_date,
             count(ch.hop_seq) AS expected_hops
      FROM demos_app.deliverable d
      JOIN migration.deliverable_action_chain ch
        ON ch.terminal_status_id = d.status_id
      GROUP BY d.id, d.status_id, d.due_date
    ), actual AS (
      SELECT a.deliverable_id,
             count(*)                                    AS actual_hops,
             count(DISTINCT a.action_timestamp)           AS distinct_ts,
             max(a.action_timestamp)                      AS last_ts,
             count(*) FILTER (WHERE a.old_due_date <> a.new_due_date) AS moved_due_date
      FROM demos_app.deliverable_action a
      GROUP BY a.deliverable_id
    ), terminal AS (
      SELECT DISTINCT ON (a.deliverable_id)
             a.deliverable_id,
             a.new_status_id AS landed_status_id
      FROM demos_app.deliverable_action a
      ORDER BY a.deliverable_id, a.action_timestamp DESC
    )
    SELECT e.deliverable_id,
           e.status_id,
           e.expected_hops,
           COALESCE(x.actual_hops, 0) AS actual_hops,
           t.landed_status_id,
           CASE
             WHEN x.deliverable_id IS NULL              THEN 'no action rows synthesized'
             WHEN x.actual_hops <> e.expected_hops      THEN 'hop count differs from the seeded chain'
             WHEN x.distinct_ts <> x.actual_hops        THEN 'action timestamps are not strictly increasing'
             WHEN t.landed_status_id <> e.status_id     THEN 'chain does not land on the deliverable status'
             WHEN x.moved_due_date > 0                  THEN 'a hop changed the due date'
             ELSE 'unknown'
           END AS reason
    FROM expected e
    LEFT JOIN actual x   ON x.deliverable_id = e.deliverable_id
    LEFT JOIN terminal t ON t.deliverable_id = e.deliverable_id
    WHERE NOT EXISTS (
            SELECT 1 FROM migration._parity_deliverable_action_held h
             WHERE h.deliverable_id = e.deliverable_id
          )
      AND (
            x.deliverable_id IS NULL
         OR x.actual_hops <> e.expected_hops
         OR x.distinct_ts <> x.actual_hops
         OR t.landed_status_id IS DISTINCT FROM e.status_id
         OR x.moved_due_date > 0
      );
  $v$;
END
$$;

