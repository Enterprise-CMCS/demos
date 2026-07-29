/*
 * Purpose:    Fail-closed validation of migration.deliverable_action_chain against DEMOS's own deliverable_action_type / deliverable_action_configuration seeds, so a synthesized action chain can never violate the target's transition graph or flag contract.
 * Inputs:     migration.deliverable_action_chain, demos_app.deliverable_action_configuration, demos_app.deliverable_action_type, demos_app.deliverable_status
 * Outputs:    none (validation only; RAISEs EXCEPTION on any violation)
 * Invariants: fail-closed on an unconfigured hop, a discontiguous chain, a chain not starting at 'Upcoming', a chain whose last hop does not reach its terminal status, an unknown terminal status, or a MINIMAL hop whose action type is not note-free and due-date-frozen; to_regclass-guarded no-op before the DEMOS seeds exist; runs in 04_crosswalks so a bad chain stops the run before any deliverable_action row is derived.
 * Refs:       sql/02_seeds_static/30_deliverable_action_chain.sql, sql/23_app_derived/60_deliverable_action.sql, sql/99_parity/62_deliverable_action_completeness.sql
 *
 * The chain seed is migration-authored, but every hop it names is a claim about
 * DEMOS's contract: that the transition is configured, and that the action type
 * permits a note-free, due-date-frozen, synthesized row. Both claims are
 * checkable against the tables Prisma seeds, so neither is left as a comment.
 *
 * Checked here rather than at load time because a violation is a defect in the
 * seed, not in the data: it should stop the run before 23_app_derived derives
 * ~21k rows that the CHECK constraints would then reject one at a time.
 *
 * The MINIMAL flag contract, asserted per hop:
 *   due_date_change_allowed = FALSE   the synthesis never moves a due date, and
 *                                     block_unpermitted_due_date_changes then
 *                                     forces old_due_date = new_due_date
 *   should_have_note        = FALSE   PMDA records no per-transition note, and
 *                                     require_notes_for_user_actions then
 *                                     forces note IS NULL
 *   extension_id_optional   = TRUE    no extension is being migrated, and
 *                                     require_extension_id_for_extension_actions
 *                                     then permits a NULL active_extension_id
 * should_have_user_id is deliberately NOT constrained to a single value: it is
 * TRUE for the six human action types and FALSE for 'Marked as Past Due', and
 * the loader reads the seeded value per type rather than assuming either.
 */
DO $$
DECLARE
  bad int;
  detail text;
BEGIN
  IF to_regclass('migration.deliverable_action_chain') IS NULL OR to_regclass('demos_app.deliverable_action_configuration') IS NULL OR to_regclass('demos_app.deliverable_action_type') IS NULL THEN
    RAISE NOTICE 'deliverable_action_chain check: chain seed or DEMOS action seeds not present yet; validation deferred';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      demos_app.deliverable_action_configuration) THEN
  RAISE NOTICE 'deliverable_action_chain check: demos_app.deliverable_action_configuration is empty; validation deferred';
  RETURN;
END IF;
  -- 1. Every hop must be a configured transition.
  SELECT
    count(*),
    string_agg(DISTINCT format('%s: %s (%s -> %s)', ch.terminal_status_id, ch.action_type_id, ch.old_status_id, ch.new_status_id), '; ')
  INTO
    bad,
    detail
  FROM
    migration.deliverable_action_chain ch
  WHERE
    NOT EXISTS (
      SELECT
        1
      FROM
        demos_app.deliverable_action_configuration cfg
      WHERE
        cfg.action_type_id = ch.action_type_id
        AND cfg.old_status_id = ch.old_status_id
        AND cfg.new_status_id = ch.new_status_id);
  IF bad > 0 THEN
    RAISE EXCEPTION 'deliverable_action_chain: % hop(s) are not configured transitions in DEMOS: %', bad, detail;
  END IF;
  -- 2. Every hop's action type must permit a note-free, due-date-frozen,
  --    extension-free synthesized row.
  SELECT
    count(*),
    string_agg(DISTINCT ch.action_type_id, ', ')
  INTO
    bad,
    detail
  FROM
    migration.deliverable_action_chain ch
    JOIN demos_app.deliverable_action_type t ON t.id = ch.action_type_id
  WHERE
    t.due_date_change_allowed
    OR t.should_have_note
    OR NOT t.extension_id_optional;
  IF bad > 0 THEN
    RAISE EXCEPTION 'deliverable_action_chain: action type(s) % are not MINIMAL-safe (they permit a due-date change, require a note, or require an extension)', detail;
  END IF;
  -- 3. Each chain must start at 'Upcoming', be contiguous, and land on its
  --    terminal status.
  SELECT
    count(*),
    string_agg(terminal_status_id, ', ')
  INTO
    bad,
    detail
  FROM (
    SELECT
      terminal_status_id
    FROM
      migration.deliverable_action_chain
    GROUP BY
      terminal_status_id
    HAVING (min(hop_seq) <> 1)
    OR (count(*) <> max(hop_seq))
    OR (max(hop_seq) FILTER (WHERE hop_seq = 1
        AND old_status_id = 'Upcoming') IS NULL)
    OR (max(new_status_id) FILTER (WHERE hop_seq =(
        SELECT
          max(h2.hop_seq)
          FROM migration.deliverable_action_chain h2 WHERE h2.terminal_status_id = deliverable_action_chain.terminal_status_id)) <> terminal_status_id)) t;
  IF bad > 0 THEN
    RAISE EXCEPTION 'deliverable_action_chain: chain(s) for % do not start at Upcoming with hop 1, run contiguously, and end on the terminal status', detail;
  END IF;
  SELECT
    count(*),
    string_agg(format('%s hop %s', a.terminal_status_id, a.hop_seq), ', ')
  INTO
    bad,
    detail
  FROM
    migration.deliverable_action_chain a
    JOIN migration.deliverable_action_chain b ON b.terminal_status_id = a.terminal_status_id
      AND b.hop_seq = a.hop_seq + 1
  WHERE
    b.old_status_id <> a.new_status_id;
  IF bad > 0 THEN
    RAISE EXCEPTION 'deliverable_action_chain: % discontiguous hop boundary/boundaries (next old_status <> previous new_status): %', bad, detail;
  END IF;
  -- 4. Every status named anywhere in the seed must be a real deliverable_status.
  IF to_regclass('demos_app.deliverable_status') IS NOT NULL THEN
    SELECT
      count(*),
      string_agg(DISTINCT s, ', ')
    INTO
      bad,
      detail
    FROM (
      SELECT
        terminal_status_id AS s
      FROM
        migration.deliverable_action_chain
      UNION
      SELECT
        old_status_id
      FROM
        migration.deliverable_action_chain
      UNION
      SELECT
        new_status_id
      FROM
        migration.deliverable_action_chain) u
  WHERE
    NOT EXISTS (
      SELECT
        1
      FROM
        demos_app.deliverable_status ds
      WHERE
        ds.id = u.s);
    IF bad > 0 THEN
      RAISE EXCEPTION 'deliverable_action_chain: unknown deliverable_status value(s): %', detail;
    END IF;
  END IF;
END
$$;

