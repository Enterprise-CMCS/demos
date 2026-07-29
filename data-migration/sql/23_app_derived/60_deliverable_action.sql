/*
 * Purpose:    Derive demos_app.deliverable_action: the MINIMAL synthesized hop chain that reconstructs how each loaded deliverable reached its current status, so a migrated deliverable has a DEMOS-legal timeline instead of an empty one.
 * Inputs:     demos_app.deliverable, demos_app.deliverable_action_type, migration.deliverable_action_chain, migration._id_map_mdcd_dlvrbl, migration._id_map_deliverable_action, mysql_raw.mdcd_dlvrbl (terminal timestamp only).
 * Outputs:    demos_app.deliverable_action, migration._id_map_deliverable_action, migration._parity_deliverable_action_held
 * Invariants: runs in the deferred-constraint build_app txn (23_app_derived, after 20_app/40_deliverable); guarded inert until demos_app.deliverable_action exists; one row per (loaded deliverable, seeded hop); note always NULL and old_due_date = new_due_date, satisfying require_notes_for_user_actions and block_unpermitted_due_date_changes; user_id follows the seeded should_have_user_id per action type ('Marked as Past Due' -> NULL); active_extension_id always NULL, permitted because every seeded type has extension_id_optional; timestamps strictly increase within a chain; a deliverable whose status has no seeded chain is held and logged, never silently skipped; idempotent via the persistent id map + NOT EXISTS + ON CONFLICT (id) DO NOTHING.
 * Refs:       sql/02_seeds_static/30_deliverable_action_chain.sql, sql/04_crosswalks/74_deliverable_action_chain_check.sql, sql/99_parity/62_deliverable_action_completeness.sql, sql/99_parity/63_deliverable_action_held.sql, reports/narrative/pending_approved_decisions.md
 *
 * PMDA stores a deliverable's current status and a few loose dates; it never
 * recorded the transitions. DEMOS renders the deliverable timeline from
 * demos_app.deliverable_action, so without this loader every migrated
 * deliverable shows no history at all. This is the MINIMAL reconstruction
 * approved for cutover: the shortest legal path from 'Upcoming' to the status
 * the deliverable actually loaded with, one action row per hop.
 *
 * What is real and what is synthesized -- stated plainly, because these rows sit
 * in what reads like an audit trail:
 *
 *   real         the deliverable, its terminal status, its due date, and the
 *                terminal timestamp (mdcd_dlvrbl.dlvrbl_stus_updt_dt); the hop-1
 *                timestamp when the deliverable's created_at precedes the chain
 *   synthesized  the existence of every intermediate hop, their timestamps, and
 *                the actor on every hop
 *
 * Why the per-hop source dates are NOT used. mdcd_dlvrbl does carry last_rcvd_dt
 * and rvw_dt, which look like natural anchors for the 'Submitted Deliverable'
 * and 'Started Review' hops. They are not usable: live PROD has 126 rows with
 * last_rcvd_dt < creatd_dt, 23 with rvw_dt < last_rcvd_dt, 2 with
 * dlvrbl_stus_updt_dt < rvw_dt, and 36 with dlvrbl_stus_updt_dt < creatd_dt.
 * Anchoring hops on those columns would emit chains that travel backwards in
 * time, which is worse than an honest uniform offset: it would look like real
 * history while being self-contradictory. They are also sparse (rvw_dt is
 * present on 0 of 320 Submitted and 0 of 244 Under CMS Review rows).
 *
 * Timestamp rule, therefore:
 *   terminal hop   COALESCE(dlvrbl_stus_updt_dt, deliverable.updated_at)
 *                  dlvrbl_stus_updt_dt is a DATE, so it is read through
 *                  migration.eastern_day_start() like every other legacy date
 *                  here: the day is real, the time of day is Eastern midnight
 *                  because the source never recorded one. It is still preferred
 *                  over updated_at, which is the last edit of ANY column and so
 *                  would attribute the status change to an unrelated edit.
 *   hop k < n      terminal minus (n - k) seconds
 *   hop 1          the deliverable's real created_at when that is at or before
 *                  the slot the rule above gives it, else that slot
 * The LEAST() on hop 1 recovers a real timestamp for the 'Created Deliverable
 * Slot' action (which is exactly what created_at records) without ever letting
 * the chain lose its strict ordering on a deliverable created and finalized
 * within the same few seconds.
 *
 * Actor: the deliverable's cms_owner_user_id on every hop that requires a user.
 * PMDA records creatd_user_id and updtd_user_id but nothing per transition, so
 * attributing the middle hops to either would be a guess dressed as provenance;
 * the owner is the one actor DEMOS already shows for the deliverable.
 * 'Marked as Past Due' has should_have_user_id = FALSE (DEMOS marks past due on
 * a timer), so its hop carries NULL and require_user_id_for_user_actions is
 * satisfied by reading the flag rather than by special-casing the type name.
 *
 * Idempotent: the id map persists across rebuilds, so re-running mints the same
 * uuid per hop, and NOT EXISTS + ON CONFLICT (id) DO NOTHING make the insert a
 * no-op the second time.
 */
SET search_path TO demos_app, migration, mysql_raw, public;

DO $$
DECLARE
  held int;
BEGIN
  IF to_regclass('demos_app.deliverable_action') IS NULL OR to_regclass('demos_app.deliverable') IS NULL THEN
    RAISE NOTICE 'skip deliverable_action derive: demos_app.deliverable_action not built yet';
    RETURN;
  END IF;
  IF to_regclass('migration.deliverable_action_chain') IS NULL THEN
    RAISE NOTICE 'skip deliverable_action derive: migration.deliverable_action_chain seed absent';
    RETURN;
  END IF;
  IF to_regclass('mysql_raw.mdcd_dlvrbl') IS NULL THEN
    RAISE NOTICE 'skip deliverable_action derive: mysql_raw.mdcd_dlvrbl absent, no terminal timestamp available';
    RETURN;
  END IF;
  CREATE TABLE IF NOT EXISTS migration._parity_deliverable_action_held(
    deliverable_id uuid PRIMARY KEY,
    status_id text,
    reason text NOT NULL
  );
  DELETE FROM migration._parity_deliverable_action_held;
  -- A loaded status with no seeded chain contributes no actions. That is a seed
  -- gap, not a data property, so it is logged per deliverable and surfaced by
  -- the gating completeness check rather than being absorbed silently.
  INSERT INTO migration._parity_deliverable_action_held(deliverable_id, status_id, reason)
  SELECT
    d.id,
    d.status_id,
    format('no action chain seeded for deliverable status %L; see sql/02_seeds_static/30_deliverable_action_chain.sql', d.status_id)
  FROM
    demos_app.deliverable d
  WHERE
    NOT EXISTS (
      SELECT
        1
      FROM
        migration.deliverable_action_chain ch
      WHERE
        ch.terminal_status_id = d.status_id);
  -- Mint a stable uuid per (deliverable, hop) before inserting, so a rebuild
  -- reuses the same action ids.
  INSERT INTO migration._id_map_deliverable_action(deliverable_id, hop_seq)
  SELECT
    d.id,
    ch.hop_seq
  FROM
    demos_app.deliverable d
    JOIN migration.deliverable_action_chain ch ON ch.terminal_status_id = d.status_id
  ON CONFLICT (deliverable_id,
    hop_seq)
    DO NOTHING;
  INSERT INTO demos_app.deliverable_action(id, action_timestamp, deliverable_id, action_type_id, old_status_id, new_status_id, note, active_extension_id, due_date_change_allowed, should_have_note, should_have_user_id, extension_id_optional, old_due_date, new_due_date, user_id)
  SELECT
    m.new_uuid,
    CASE WHEN h.hop_seq = 1 THEN
      LEAST(h.created_at, h.terminal_ts - make_interval(secs => h.hop_count - 1))
    ELSE
      h.terminal_ts - make_interval(secs => h.hop_count - h.hop_seq)
    END,
    h.deliverable_id,
    h.action_type_id,
    h.old_status_id,
    h.new_status_id,
    NULL,
    NULL,
    t.due_date_change_allowed,
    t.should_have_note,
    t.should_have_user_id,
    t.extension_id_optional,
    h.due_date,
    h.due_date,
    CASE WHEN t.should_have_user_id THEN
      h.cms_owner_user_id
    END
  FROM (
    SELECT
      d.id AS deliverable_id,
      d.due_date,
      d.created_at,
      d.cms_owner_user_id,
      ch.hop_seq,
      ch.action_type_id,
      ch.old_status_id,
      ch.new_status_id,
      max(ch.hop_seq) OVER (PARTITION BY d.id) AS hop_count,
      COALESCE(migration.eastern_day_start(src.dlvrbl_stus_updt_dt), d.updated_at) AS terminal_ts
    FROM
      demos_app.deliverable d
      JOIN migration.deliverable_action_chain ch ON ch.terminal_status_id = d.status_id
      LEFT JOIN migration._id_map_mdcd_dlvrbl im ON im.new_uuid = d.id
      LEFT JOIN mysql_raw.mdcd_dlvrbl src ON src.mdcd_dlvrbl_id = im.legacy_int_id) h
  JOIN migration._id_map_deliverable_action m ON m.deliverable_id = h.deliverable_id
    AND m.hop_seq = h.hop_seq
  JOIN demos_app.deliverable_action_type t ON t.id = h.action_type_id
WHERE
  NOT EXISTS (
    SELECT
      1
    FROM
      demos_app.deliverable_action ex
    WHERE
      ex.id = m.new_uuid)
ON CONFLICT (id)
  DO NOTHING;
    SELECT
      count(*)
    INTO
      held
    FROM
      migration._parity_deliverable_action_held;
    IF held > 0 THEN
      RAISE NOTICE 'deliverable_action derive: % deliverable(s) have no seeded action chain; see migration._parity_deliverable_action_held', held;
    END IF;
END
$$;

