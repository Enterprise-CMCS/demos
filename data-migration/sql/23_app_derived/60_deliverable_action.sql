/*
 * Purpose:    Derive demos_app.deliverable_action: real submissions reconstructed from state file-upload batches, stitched into the seeded minimal hop chain, so a migrated deliverable has a DEMOS-legal timeline and every migrated document has a submission to attach to.
 * Inputs:     demos_app.deliverable, demos_app.deliverable_action_type, demos_app.users, migration.deliverable_action_chain, migration._id_map_mdcd_dlvrbl, migration._id_map_deliverable_action, stg.deliverable_submission_batch (optional), mysql_raw.mdcd_dlvrbl (terminal timestamp), mysql_raw.mdcd_dlvrbl_stus_hstry (optional).
 * Outputs:    demos_app.deliverable_action, migration._id_map_deliverable_action, migration._deliverable_submission_event, migration._deliverable_action_plan, migration._parity_deliverable_action_held
 * Invariants: runs in the deferred-constraint build_app txn (23_app_derived, after 20_app/40_deliverable); guarded inert until demos_app.deliverable_action exists; degrades to the pre-batch synthetic behaviour when stg.deliverable_submission_batch is absent; note always NULL and old_due_date = new_due_date, satisfying require_notes_for_user_actions and block_unpermitted_due_date_changes; user_id follows the seeded should_have_user_id per action type; active_extension_id always NULL; timestamps strictly increase within a chain; a deliverable whose status has no seeded chain is held and logged, never silently skipped; idempotent via the persistent id map + NOT EXISTS + ON CONFLICT (id) DO NOTHING.
 * Refs:       sql/10_stg/39_deliverable_submission_batch.sql, sql/02_seeds_static/30_deliverable_action_chain.sql, sql/04_crosswalks/74_deliverable_action_chain_check.sql, sql/99_parity/62_deliverable_action_completeness.sql, sql/99_parity/63_deliverable_action_held.sql
 *
 * DEMOS renders a deliverable's timeline from demos_app.deliverable_action, and
 * demos_app.document attaches a state-submitted file to a specific
 * `Submitted Deliverable` action. A migrated deliverable with no action rows
 * therefore shows an empty history AND leaves every one of its documents with a
 * dangling submission link.
 *
 * The seeded chain (02_seeds_static/30_*) supplies the skeleton: the shortest
 * legal path from 'Upcoming' to the status the deliverable loaded with. This
 * loader replaces the single synthetic `Submitted Deliverable` hop in that
 * skeleton with the submissions that actually happened.
 *
 * WHERE SUBMISSIONS COME FROM
 *
 * mdcd_dlvrbl_fil_doc is the record of what a state actually sent. Clustered
 * into upload sessions by stg.deliverable_submission_batch, it yields one
 * submission per session with a real timestamp and a real actor. It beats
 * mdcd_dlvrbl_stus_hstry on both counts: user_id is NOT NULL and 100% of
 * in-scope live uploaders resolve to a migrated DEMOS user, against 84.1% actor
 * coverage on the status log; and on 22.0% of deliverables with state uploads
 * (1,167 of 5,296) the log records fewer submissions than the file trail, a gap
 * that runs 20-29% in every year from 2016 to 2026.
 *
 * That gap is a shortfall in what the log RECORDS, not in whether a row exists:
 * deliverables with no status row at all peak at 14.1% in 2016 and sit under
 * 3% everywhere else. An earlier revision of this header claimed the log was
 * "20-41% missing outright before 2021"; that does not reproduce under any
 * reading and has been withdrawn. The genuine pre-2019 defect is a different
 * one -- creatd_dt carries no time of day -- and is described in
 * stg.deliverable_submission_batch.
 *
 * Only cmt_orgn_cd = 'S' (state upload) becomes a submission. 'C' is a
 * CMS attachment and must carry a NULL submission link
 * (no_submitted_deliverable_cms_files); it is excluded here.
 *
 * Four populations, resolved into migration._deliverable_submission_event:
 *
 *   file_batch    the deliverable has state upload sessions -> one real
 *                 submission per session, real timestamp, real uploader.
 *                 Two counts, because they differ and confusing them is easy:
 *                 5,276 deliverables / 7,225 rows land in the event table, of
 *                 which 5,223 / 7,158 become actions. The 53 deliverables and
 *                 67 rows in between are the no-submission-hop chains noted
 *                 below. Sessions flagged after_accepted_ind are excluded: a
 *                 late addition to a closed deliverable is not evidence it was
 *                 submitted. That drops 320 sessions and costs no deliverable
 *                 its entire evidence.
 *   status_event  no uploads survive, but the source does carry a real
 *                 'Submitted' status event -> keep ONE synthetic hop, exactly
 *                 as before this loader consumed batches. 7 deliverables.
 *   status_field  no uploads and no event, but the deliverable's own status IS
 *                 'Submitted', so the submission is the chain's terminal hop ->
 *                 keep ONE hop carrying submitted_at = NULL. The status field
 *                 is source data and it attests the submission; what no source
 *                 attests is WHEN, so no timestamp is invented. 0 deliverables
 *                 today, and it is the reason the row below is safe.
 *   (suppressed)  no uploads and no submitted event -> emit NO submission hop.
 *                 6 deliverables. Previously these were handed a fabricated
 *                 `Submitted Deliverable` action purely because their terminal
 *                 status sits past 'Submitted' in the chain; that asserted a
 *                 submission the source contradicts.
 *
 * A deliverable whose terminal status has no submission hop in its chain
 * ('Upcoming', 'Past Due') is untouched even when it has upload sessions: the
 * chain, not this loader, decides which hops exist. That currently leaves 53
 * deliverables' 67 batches unused, which is a chain-seed question, not a
 * submission-evidence one.
 *
 * WHAT IS REAL AND WHAT IS SYNTHESIZED -- stated plainly, because these rows sit
 * in what reads like an audit trail:
 *
 *   real         the deliverable, its terminal status, its due date, the
 *                terminal timestamp (mdcd_dlvrbl.dlvrbl_stus_updt_dt), the
 *                hop-1 timestamp when created_at precedes the chain, and now
 *                every file_batch submission's timestamp and actor
 *   synthesized  the existence of every non-submission intermediate hop, their
 *                timestamps, and their actor
 *
 * Why the per-hop source dates are still NOT used for the other hops.
 * mdcd_dlvrbl carries last_rcvd_dt and rvw_dt, which look like natural anchors
 * for 'Started Review'. They are not usable: live PROD has 126 rows with
 * last_rcvd_dt < creatd_dt, 23 with rvw_dt < last_rcvd_dt, 2 with
 * dlvrbl_stus_updt_dt < rvw_dt, and 36 with dlvrbl_stus_updt_dt < creatd_dt.
 * Anchoring hops on those columns would emit chains that travel backwards in
 * time. They are also sparse (rvw_dt is present on 0 of 320 Submitted and 0 of
 * 244 Under CMS Review rows).
 *
 * TIMESTAMP RULE
 *
 * With n = chain length and k = number of submissions on the deliverable:
 *   terminal hop    COALESCE(eastern_day_start(dlvrbl_stus_updt_dt), updated_at)
 *   submission j    LEAST(real submitted_at, terminal - ((n-2) + (k-j)) sec)
 *   other hop h>1   terminal - (n-h) sec
 *   hop 1           LEAST(created_at, terminal - ((n-1) + GREATEST(k-1,0)) sec)
 * The caps are what keep the chain strictly increasing when a real submission
 * lands at or after the terminal timestamp, which 870 of 7,545 do -- about half
 * genuinely (files uploaded after acceptance, cf. upld_aftr_acptd_ind) and half
 * as an artifact of dlvrbl_stus_updt_dt being a DATE read at Eastern midnight.
 * A capped submission keeps its ordering, not its clock reading. For k <= 1
 * every formula above collapses to the pre-batch rule exactly.
 *
 * ACTOR
 *
 * A file_batch submission is attributed to the uploader. Everything else keeps
 * the deliverable's cms_owner_user_id: PMDA records creatd_user_id and
 * updtd_user_id but nothing per transition, so attributing a middle hop to
 * either would be a guess dressed as provenance. The uploader falls back to the
 * owner if it does not resolve to a demos_app.users row (2 batches today),
 * because require_user_id_for_user_actions forbids a NULL there.
 * 'Marked as Past Due' has should_have_user_id = FALSE (DEMOS marks past due on
 * a timer), so its hop carries NULL by reading the flag rather than by
 * special-casing the type name.
 *
 * hop_seq ALLOCATION
 *
 * The submission hop is hop 2 in every seeded chain. Submission 1 keeps
 * hop_seq 2 so previously minted action uuids are reused; submissions 2..k take
 * hop_seq 100 + j. Chains are at most 4 hops and the busiest deliverable has 15
 * submissions, so the two ranges cannot collide.
 *
 * Idempotent: the id map persists across rebuilds, so re-running mints the same
 * uuid per (deliverable, hop), and NOT EXISTS + ON CONFLICT (id) DO NOTHING make
 * the insert a no-op the second time.
 */
SET search_path TO demos_app, migration, mysql_raw, public;

DO $$
DECLARE
  held int;
  batches_available boolean;
  hstry_available boolean;
  due_windows_available boolean;
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
  batches_available := to_regclass('stg.deliverable_submission_batch') IS NOT NULL;
  hstry_available := to_regclass('mysql_raw.mdcd_dlvrbl_stus_hstry') IS NOT NULL;
  due_windows_available := to_regclass('stg.deliverable_due_date_window') IS NOT NULL;
  CREATE TABLE IF NOT EXISTS migration._parity_deliverable_action_held(
    deliverable_id uuid PRIMARY KEY,
    status_id text,
    reason text NOT NULL
  );
  DELETE FROM migration._parity_deliverable_action_held;
  -- Resolved submission events, one row per submission a deliverable will get.
  -- submitted_at NULL means "no real clock reading; use the synthetic slot".
  CREATE TABLE IF NOT EXISTS migration._deliverable_submission_event(
    deliverable_id uuid NOT NULL,
    sub_seq smallint NOT NULL,
    submitted_at timestamptz,
    user_id uuid,
    anchor_fil_doc_id bigint,
    source text NOT NULL,
    PRIMARY KEY (deliverable_id, sub_seq)
  );
  -- Re-stated rather than declared inline: CREATE TABLE IF NOT EXISTS leaves an
  -- older table's CHECK in place, and parity 62 depends on this table so it
  -- cannot simply be dropped and rebuilt.
  ALTER TABLE migration._deliverable_submission_event
    DROP CONSTRAINT IF EXISTS _deliverable_submission_event_source_check;
  ALTER TABLE migration._deliverable_submission_event
    ADD CONSTRAINT _deliverable_submission_event_source_check CHECK (source IN ('file_batch', 'status_event', 'status_field'));
  DELETE FROM migration._deliverable_submission_event;
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
  IF batches_available THEN
    -- Real submissions: one per state upload session.
    EXECUTE $q$
      INSERT INTO migration._deliverable_submission_event(deliverable_id, sub_seq, submitted_at, user_id, anchor_fil_doc_id, source)
      SELECT
        b.deliverable_id,
        row_number() OVER (PARTITION BY b.deliverable_id ORDER BY b.submitted_at, b.batch_seq),
        b.submitted_at,
        u.id,
        b.anchor_fil_doc_id,
        'file_batch'
      FROM
        stg.deliverable_submission_batch b
        JOIN demos_app.deliverable d ON d.id = b.deliverable_id
        LEFT JOIN demos_app.users u ON u.id = b.uploader_user_id
      WHERE
        b.origin_cd = 'S'
        -- The source flags uploads that arrived after the deliverable was
        -- already accepted. A late addition to a closed deliverable is not
        -- evidence that it was submitted, so it mints no hop.
        AND b.after_accepted_ind = 0
    $q$;
    IF hstry_available THEN
      -- No surviving uploads, but the source does record a real submission.
      EXECUTE $q$
        INSERT INTO migration._deliverable_submission_event(deliverable_id, sub_seq, submitted_at, user_id, anchor_fil_doc_id, source)
        SELECT DISTINCT
          d.id,
          1::smallint,
          NULL::timestamptz,
          NULL::uuid,
          NULL::bigint,
          'status_event'
        FROM
          demos_app.deliverable d
          JOIN migration._id_map_mdcd_dlvrbl im ON im.new_uuid = d.id
          JOIN mysql_raw.mdcd_dlvrbl_stus_hstry h ON h.mdcd_dlvrbl_id = im.legacy_int_id
            AND h.mdcd_dlvrbl_stus_cd = 3
        WHERE
          NOT EXISTS (
            SELECT
              1
            FROM
              migration._deliverable_submission_event e
            WHERE
              e.deliverable_id = d.id)
      $q$;
    END IF;
    -- The deliverable's own status is source data too. When the chain's TERMINAL
    -- hop is the submission -- status 'Submitted' -- suppressing it would end the
    -- timeline on 'Upcoming' while DEMOS displays 'Submitted'. That is a
    -- contradiction, not a conservative omission, so one synthetic hop is kept.
    -- Suppression stays correct for statuses past 'Submitted', where dropping the
    -- hop costs a waypoint but still lands on the right status.
    INSERT INTO migration._deliverable_submission_event(deliverable_id, sub_seq, submitted_at, user_id, anchor_fil_doc_id, source)
    SELECT DISTINCT
      d.id,
      1::smallint,
      NULL::timestamptz,
      NULL::uuid,
      NULL::bigint,
      'status_field'
    FROM
      demos_app.deliverable d
      JOIN migration.deliverable_action_chain ch ON ch.terminal_status_id = d.status_id
    WHERE
      ch.action_type_id = 'Submitted Deliverable'
      AND ch.hop_seq =(
        SELECT
          max(c2.hop_seq)
        FROM
          migration.deliverable_action_chain c2
        WHERE
          c2.terminal_status_id = d.status_id)
      AND NOT EXISTS (
        SELECT
          1
        FROM
          migration._deliverable_submission_event e
        WHERE
          e.deliverable_id = d.id);
  ELSE
    -- Degraded mode: stg was not built, so there is no submission evidence to
    -- read. Reproduce the pre-batch behaviour exactly (one synthetic hop for
    -- every chain that has one) rather than silently dropping submissions.
    RAISE NOTICE 'deliverable_action derive: stg.deliverable_submission_batch absent; falling back to one synthetic submission per chain';
    INSERT INTO migration._deliverable_submission_event(deliverable_id, sub_seq, submitted_at, user_id, anchor_fil_doc_id, source)
    SELECT DISTINCT
      d.id,
      1::smallint,
      NULL::timestamptz,
      NULL::uuid,
      NULL::bigint,
      'status_event'
    FROM
      demos_app.deliverable d
      JOIN migration.deliverable_action_chain ch ON ch.terminal_status_id = d.status_id
    WHERE
      ch.action_type_id = 'Submitted Deliverable';
  END IF;
  -- The effective hop list: the seeded chain with its submission hop replaced by
  -- the resolved submission events. Materialized so the mint and the insert read
  -- one identical plan.
  CREATE TABLE IF NOT EXISTS migration._deliverable_action_plan(
    deliverable_id uuid NOT NULL,
    hop_seq smallint NOT NULL,
    action_timestamp timestamptz NOT NULL,
    action_type_id text NOT NULL,
    old_status_id text NOT NULL,
    new_status_id text NOT NULL,
    actor_user_id uuid,
    due_date timestamptz NOT NULL,
    submission_source text,
    anchor_fil_doc_id bigint,
    PRIMARY KEY (deliverable_id, hop_seq)
  );
  DELETE FROM migration._deliverable_action_plan;
  INSERT INTO migration._deliverable_action_plan(deliverable_id, hop_seq, action_timestamp, action_type_id, old_status_id, new_status_id, actor_user_id, due_date, submission_source, anchor_fil_doc_id)
  WITH anchored AS (
    SELECT
      d.id AS deliverable_id,
      d.due_date,
      d.created_at,
      d.cms_owner_user_id,
      d.status_id,
      COALESCE(migration.eastern_day_start(src.dlvrbl_stus_updt_dt), d.updated_at) AS terminal_ts,
(
        SELECT
          max(ch.hop_seq)
        FROM
          migration.deliverable_action_chain ch
        WHERE
          ch.terminal_status_id = d.status_id) AS hop_count,
(
          SELECT
            count(*)
          FROM
            migration._deliverable_submission_event e
          WHERE
            e.deliverable_id = d.id) AS sub_count
        FROM
          demos_app.deliverable d
        LEFT JOIN migration._id_map_mdcd_dlvrbl im ON im.new_uuid = d.id
        LEFT JOIN mysql_raw.mdcd_dlvrbl src ON src.mdcd_dlvrbl_id = im.legacy_int_id
      WHERE
        EXISTS (
          SELECT
            1
          FROM
            migration.deliverable_action_chain ch
          WHERE
            ch.terminal_status_id = d.status_id))
      -- Every hop except the submission, unchanged.
      SELECT
        a.deliverable_id,
        ch.hop_seq,
        CASE WHEN ch.hop_seq = 1 THEN
          LEAST(a.created_at, a.terminal_ts - make_interval(secs =>(a.hop_count - 1) + GREATEST(a.sub_count - 1, 0)))
        ELSE
          a.terminal_ts - make_interval(secs => a.hop_count - ch.hop_seq)
        END,
        ch.action_type_id,
        ch.old_status_id,
        ch.new_status_id,
        a.cms_owner_user_id,
        a.due_date,
        NULL,
        NULL
      FROM
        anchored a
        JOIN migration.deliverable_action_chain ch ON ch.terminal_status_id = a.status_id
      WHERE
        ch.action_type_id <> 'Submitted Deliverable'
      UNION ALL
      -- The submission hop, expanded to one row per resolved submission.
      SELECT
        a.deliverable_id,
        CASE WHEN e.sub_seq = 1 THEN
          ch.hop_seq
        ELSE
          (100 + e.sub_seq)::smallint
        END,
        LEAST(COALESCE(e.submitted_at, 'infinity'::timestamptz), a.terminal_ts - make_interval(secs =>(a.hop_count - 2) +(a.sub_count - e.sub_seq))),
        ch.action_type_id,
        -- A repeat submission departs from 'Submitted', which
        -- deliverable_action_configuration permits as a self-transition.
        CASE WHEN e.sub_seq = 1 THEN
          ch.old_status_id
        ELSE
          'Submitted'
        END,
        ch.new_status_id,
        COALESCE(e.user_id, a.cms_owner_user_id),
        a.due_date,
        e.source,
        e.anchor_fil_doc_id
      FROM
        anchored a
        JOIN migration.deliverable_action_chain ch ON ch.terminal_status_id = a.status_id
          AND ch.action_type_id = 'Submitted Deliverable'
        JOIN migration._deliverable_submission_event e ON e.deliverable_id = a.deliverable_id;
    -- Re-point each hop at the due date in effect at its OWN timestamp. Until
    -- this ran, every action carried the deliverable's current due date, so a
    -- submission predating an extension recorded the extended date rather than
    -- the one it was judged against. Windows tile contiguously and never
    -- overlap, so at most one row matches and the result does not depend on
    -- physical order. A deliverable with no recorded history matches nothing and
    -- keeps the current value, which is the intended fallback, not a failure.
    IF due_windows_available THEN
      EXECUTE $q$
        UPDATE
          migration._deliverable_action_plan p
        SET
          due_date = w.due_date
        FROM
          stg.deliverable_due_date_window w
        WHERE
          w.deliverable_id = p.deliverable_id
          AND p.action_timestamp >= w.valid_from
          AND p.action_timestamp < w.valid_to
      $q$;
    END IF;
    -- Mint a stable uuid per (deliverable, hop) before inserting, so a rebuild
    -- reuses the same action ids.
    INSERT INTO migration._id_map_deliverable_action(deliverable_id, hop_seq)
    SELECT
      p.deliverable_id,
      p.hop_seq
    FROM
      migration._deliverable_action_plan p
    ON CONFLICT (deliverable_id,
      hop_seq)
      DO NOTHING;
    INSERT INTO demos_app.deliverable_action(id, action_timestamp, deliverable_id, action_type_id, old_status_id, new_status_id, note, active_extension_id, due_date_change_allowed, should_have_note, should_have_user_id, extension_id_optional, old_due_date, new_due_date, user_id)
    SELECT
      m.new_uuid,
      p.action_timestamp,
      p.deliverable_id,
      p.action_type_id,
      p.old_status_id,
      p.new_status_id,
      NULL,
      NULL,
      t.due_date_change_allowed,
      t.should_have_note,
      t.should_have_user_id,
      t.extension_id_optional,
      p.due_date,
      p.due_date,
      CASE WHEN t.should_have_user_id THEN
        p.actor_user_id
      END
    FROM
      migration._deliverable_action_plan p
      JOIN migration._id_map_deliverable_action m ON m.deliverable_id = p.deliverable_id
        AND m.hop_seq = p.hop_seq
      JOIN demos_app.deliverable_action_type t ON t.id = p.action_type_id
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

