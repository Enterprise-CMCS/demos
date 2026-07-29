/*
 * Purpose:    Asserts the reconstructed file-upload sessions in stg still obey the grouping rule they claim -- every in-scope file batched exactly once, sessions split only where the rule says, and each corroborating status event claimed by at most one batch.
 * Inputs:     stg.deliverable_file_batch; stg.deliverable_submission_batch; stg._valid_dlvrbl_ids; mysql_raw.mdcd_dlvrbl_fil_doc
 * Outputs:    migration._parity_deliverable_submission_batch
 * Invariants: Non-empty -> RED; conditional-DDL guard (created only when the stg batch views and their source are present, so the app-layers idempotency harness applies it as a no-op); idempotent via CREATE OR REPLACE; recomputes the expected grouping from mysql_raw rather than trusting the view it is checking.
 * Refs:       migration/phases/parity.py "Deliverable submission batches" CheckResult; sql/10_stg/39_deliverable_submission_batch.sql, sql/23_app_derived/60_deliverable_action.sql
 *
 * Parity check: deliverable submission-batch reconstruction.
 *
 * 39_deliverable_submission_batch.sql turns raw file uploads into submission
 * events by grouping consecutive live files on the same deliverable, by the same
 * uploader, with no gap wider than the session window. Everything downstream
 * depends on that grouping being right: 60_deliverable_action.sql mints one
 * `Submitted Deliverable` action per batch, and the document loader attaches
 * each migrated file to the submission it arrived in. A grouping defect does not
 * fail loudly -- it silently merges two submissions into one, or splits one into
 * two, and the resulting timeline looks plausible.
 *
 * So this check does not sample the view's output; it recomputes what the
 * grouping should be straight from mysql_raw and reports every disagreement.
 *
 * WHAT IS ASSERTED
 *
 *   conservation  every live, in-scope file appears in exactly one batch. The
 *                 file view INNER JOINs migration._id_map_mdcd_dlvrbl, so a
 *                 missing id-map row drops files silently and a duplicated one
 *                 fans them out; both are caught here rather than surfacing as
 *                 an unexplained batch-count change.
 *   sequencing    batch_seq is 1-based and contiguous within each
 *                 (deliverable, origin). A window-function regression that lost
 *                 its PARTITION BY shows up here first.
 *   grouping      no batch spans two uploaders, no gap *inside* a batch exceeds
 *                 the window, and every batch boundary is justified by an
 *                 uploader change or a wide-enough gap. The last one is what
 *                 catches over-splitting, which is otherwise invisible.
 *   aggregation   the one-row-per-submission view agrees with the per-file view
 *                 on membership, file_count, and batch bounds.
 *   corroboration a Submitted event is claimed by at most one batch (the view
 *                 promises a 1:1 mutual-nearest match), events attach only to
 *                 state uploads, and submitted_at is either the matched event
 *                 instant or the last upload -- never anything else.
 *
 * THE WINDOW CONSTANT IS DUPLICATED ON PURPOSE
 *
 * `interval '60 minutes'` below must match the window in 39_*.sql. Duplicating
 * it is deliberate and self-detecting rather than a latent inconsistency: if the
 * stg view widens its window and this file is not updated, the wider sessions
 * trip 'gap inside a batch exceeds the session window'; if it narrows, the extra
 * splits trip 'batch boundary is not justified...'. Drift in either direction
 * turns this check RED instead of passing quietly.
 *
 * WHAT IS DELIBERATELY NOT ASSERTED
 *
 * uploader_user_id may be NULL: the file view LEFT JOINs the user id map by
 * design, and 60_*.sql falls back to the CMS owner. Asserting NOT NULL here
 * would turn a designed degradation into a build failure.
 *
 * Consumed by migration/phases/parity.py. Non-empty -> RED.
 *
 * Conditional DDL: guarded so the app-layers idempotency harness, which stands
 * up demos_app without the stg layer, applies this file as a clean no-op.
 */
SET search_path TO migration, stg, mysql_raw, public;

DO $$
BEGIN
  IF to_regclass('stg.deliverable_file_batch') IS NULL OR to_regclass('stg.deliverable_submission_batch') IS NULL OR to_regclass('stg._valid_dlvrbl_ids') IS NULL OR to_regclass('mysql_raw.mdcd_dlvrbl_fil_doc') IS NULL THEN
    RAISE NOTICE 'parity deliverable_submission_batch: stg batch views or their source absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_deliverable_submission_batch AS
    WITH
    -- Recomputed from source: exactly the files the file view is supposed to
    -- carry, before any id-map join.
    scoped AS (
      SELECT f.mdcd_dlvrbl_fil_doc_id AS fil_doc_id,
             f.mdcd_dlvrbl_id         AS dlvrbl_id
      FROM mysql_raw.mdcd_dlvrbl_fil_doc f
      JOIN stg._valid_dlvrbl_ids v ON v.dlvrbl_id = f.mdcd_dlvrbl_id
      WHERE f.dltd_ind = 0
        AND f.creatd_dt IS NOT NULL
    ),
    per_batch AS (
      SELECT fb.legacy_dlvrbl_id,
             fb.origin_cd,
             fb.batch_seq,
             count(*)::int                          AS file_count,
             count(DISTINCT fb.legacy_uploader_id)  AS uploader_count,
             min(fb.uploaded_at)                    AS batch_start_at,
             max(fb.uploaded_at)                    AS batch_end_at
      FROM stg.deliverable_file_batch fb
      GROUP BY fb.legacy_dlvrbl_id, fb.origin_cd, fb.batch_seq
    ),
    seq_bounds AS (
      SELECT fb.legacy_dlvrbl_id,
             fb.origin_cd,
             min(fb.batch_seq)            AS lo,
             max(fb.batch_seq)            AS hi,
             count(DISTINCT fb.batch_seq) AS distinct_seqs
      FROM stg.deliverable_file_batch fb
      GROUP BY fb.legacy_dlvrbl_id, fb.origin_cd
    ),
    -- Consecutive files in the same order the view batches them, so a boundary
    -- can be tested against the rule that was supposed to create it.
    adjacent AS (
      SELECT fb.legacy_dlvrbl_id,
             fb.origin_cd,
             fb.batch_seq,
             fb.legacy_uploader_id,
             fb.uploaded_at,
             lag(fb.batch_seq)          OVER w AS prev_seq,
             lag(fb.legacy_uploader_id) OVER w AS prev_uploader,
             lag(fb.uploaded_at)        OVER w AS prev_at
      FROM stg.deliverable_file_batch fb
      WINDOW w AS (PARTITION BY fb.legacy_dlvrbl_id, fb.origin_cd
                   ORDER BY fb.uploaded_at, fb.legacy_fil_doc_id)
    )
    -- conservation ---------------------------------------------------------
    SELECT s.dlvrbl_id                          AS legacy_dlvrbl_id,
           NULL::text                           AS origin_cd,
           NULL::int                            AS batch_seq,
           'file missing from the batch view'   AS reason,
           'fil_doc_id ' || s.fil_doc_id::text  AS detail
    FROM scoped s
    WHERE NOT EXISTS (
            SELECT 1 FROM stg.deliverable_file_batch fb
             WHERE fb.legacy_fil_doc_id = s.fil_doc_id
          )
    UNION ALL
    SELECT min(fb.legacy_dlvrbl_id),
           NULL::text,
           NULL::int,
           'file assigned to more than one batch',
           'fil_doc_id ' || fb.legacy_fil_doc_id::text || ' appears ' || count(*)::text || ' times'
    FROM stg.deliverable_file_batch fb
    GROUP BY fb.legacy_fil_doc_id
    HAVING count(*) > 1
    -- sequencing -----------------------------------------------------------
    UNION ALL
    SELECT sb.legacy_dlvrbl_id,
           sb.origin_cd::text,
           sb.lo,
           'batch_seq does not start at 1',
           'lowest batch_seq is ' || sb.lo::text
    FROM seq_bounds sb
    WHERE sb.lo <> 1
    UNION ALL
    SELECT sb.legacy_dlvrbl_id,
           sb.origin_cd::text,
           sb.hi,
           'batch_seq is not contiguous',
           sb.distinct_seqs::text || ' distinct batch_seq value(s) but the highest is ' || sb.hi::text
    FROM seq_bounds sb
    WHERE sb.hi <> sb.distinct_seqs
    -- grouping rule --------------------------------------------------------
    UNION ALL
    SELECT p.legacy_dlvrbl_id,
           p.origin_cd::text,
           p.batch_seq,
           'batch spans more than one uploader',
           p.uploader_count::text || ' distinct uploaders in one batch'
    FROM per_batch p
    WHERE p.uploader_count > 1
    UNION ALL
    SELECT a.legacy_dlvrbl_id,
           a.origin_cd::text,
           a.batch_seq,
           'gap inside a batch exceeds the session window',
           'gap of ' || (a.uploaded_at - a.prev_at)::text || ' between consecutive files'
    FROM adjacent a
    WHERE a.batch_seq = a.prev_seq
      AND a.uploaded_at - a.prev_at > interval '60 minutes'
    UNION ALL
    SELECT a.legacy_dlvrbl_id,
           a.origin_cd::text,
           a.batch_seq,
           'batch boundary is not justified by an uploader change or a window gap',
           'new batch after a gap of only ' || (a.uploaded_at - a.prev_at)::text || ' with an unchanged uploader'
    FROM adjacent a
    WHERE a.batch_seq <> a.prev_seq
      AND a.legacy_uploader_id IS NOT DISTINCT FROM a.prev_uploader
      AND a.uploaded_at - a.prev_at <= interval '60 minutes'
    -- aggregation ----------------------------------------------------------
    UNION ALL
    SELECT COALESCE(p.legacy_dlvrbl_id, b.legacy_dlvrbl_id),
           COALESCE(p.origin_cd, b.origin_cd)::text,
           COALESCE(p.batch_seq, b.batch_seq),
           CASE
             WHEN b.batch_seq IS NULL      THEN 'aggregate row missing for a batch in the file view'
             WHEN p.batch_seq IS NULL      THEN 'aggregate row has no matching files'
             WHEN b.file_count <> p.file_count
                                           THEN 'file_count disagrees with the file view'
             ELSE                               'batch bounds disagree with the file view'
           END,
           'files ' || COALESCE(b.file_count::text, '-') || ' vs ' || COALESCE(p.file_count::text, '-')
    FROM per_batch p
    FULL JOIN stg.deliverable_submission_batch b
      ON  b.legacy_dlvrbl_id = p.legacy_dlvrbl_id
      AND b.origin_cd        = p.origin_cd
      AND b.batch_seq        = p.batch_seq
    WHERE b.batch_seq IS NULL
       OR p.batch_seq IS NULL
       OR b.file_count     <> p.file_count
       OR b.batch_start_at <> p.batch_start_at
       OR b.batch_end_at   <> p.batch_end_at
    UNION ALL
    SELECT b.legacy_dlvrbl_id,
           b.origin_cd::text,
           b.batch_seq,
           'deliverable_id did not resolve',
           'no migration._id_map_mdcd_dlvrbl row for this deliverable'
    FROM stg.deliverable_submission_batch b
    WHERE b.deliverable_id IS NULL
    -- corroboration --------------------------------------------------------
    UNION ALL
    SELECT min(b.legacy_dlvrbl_id),
           NULL::text,
           NULL::int,
           'status event claimed by more than one batch',
           'event ' || b.corroborating_status_event_id::text || ' claimed by ' || count(*)::text || ' batches'
    FROM stg.deliverable_submission_batch b
    WHERE b.corroborating_status_event_id IS NOT NULL
    GROUP BY b.corroborating_status_event_id
    HAVING count(*) > 1
    UNION ALL
    SELECT b.legacy_dlvrbl_id,
           b.origin_cd::text,
           b.batch_seq,
           'corroborating event attached to a non-state batch',
           'origin ' || b.origin_cd::text || ' carries event ' || b.corroborating_status_event_id::text
    FROM stg.deliverable_submission_batch b
    WHERE b.origin_cd <> 'S'
      AND b.corroborating_status_event_id IS NOT NULL
    UNION ALL
    SELECT b.legacy_dlvrbl_id,
           b.origin_cd::text,
           b.batch_seq,
           'submitted_at is neither the event instant nor the last upload',
           'submitted_at ' || b.submitted_at::text
    FROM stg.deliverable_submission_batch b
    WHERE b.submitted_at IS DISTINCT FROM COALESCE(b.corroborating_status_event_at, b.batch_end_at);
  $v$;
END
$$;

