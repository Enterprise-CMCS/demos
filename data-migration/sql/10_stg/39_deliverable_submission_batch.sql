/*
 * Purpose:    Reconstruct deliverable submission events from file-upload sessions, so every migrated document has a real submission to attach to instead of one synthetic action per deliverable.
 * Inputs:     mysql_raw.mdcd_dlvrbl_fil_doc, mysql_raw.mdcd_dlvrbl_stus_hstry, stg._valid_dlvrbl_ids, migration._id_map_mdcd_dlvrbl, migration._id_map_users
 * Outputs:    CREATE OR REPLACE VIEW stg.deliverable_file_batch, stg.deliverable_submission_batch
 * Invariants: source-only (mysql_raw + id maps + stg only; never crosswalks 04 / seeds 02); idempotent (CREATE OR REPLACE VIEW); batch numbering is deterministic (ordered by uploaded_at then the fil_doc PK, so a re-run reproduces identical batch_seq); one row per (deliverable, origin, batch) in the aggregate; corroborating status events are matched 1:1 (no event is claimed by two batches); emits BOTH origins -- the 'S'-only routing decision belongs to the loader.
 * Refs:       docs/specs/pmda-history-tables-derivation-spec.md, sql/10_stg/30_document_deliverable_link_resolved.sql, sql/23_app_derived/60_deliverable_action.sql
 *
 * WHY THIS EXISTS
 *
 * The shipped MINIMAL deliverable_action loader synthesizes a fixed chain from
 * each deliverable's *terminal* status, which yields exactly one
 * `Submitted Deliverable` action per deliverable (5,236 today, one each). That
 * is not enough to carry the document contract: demos_app.document routes a
 * state-submitted file to a specific submission action
 * (deliverable_submission_action_id), and 704 in-scope deliverables were
 * submitted more than once (565 twice, 107 three times, one thirteen times).
 * Under MINIMAL every document across every resubmission round collapses onto a
 * single synthetic action.
 *
 * mdcd_dlvrbl_stus_hstry cannot fix this on its own:
 *   - coverage: deliverables created before 2021 are 20-41% missing from it
 *     entirely; 2021+ is ~0% missing.
 *   - attribution: only 84.0% of its `Submitted` events carry an actor.
 * The file table is strictly better on both counts -- user_id is NOT NULL and
 * 100% of in-scope live uploaders (12,682/12,682) resolve to a migrated DEMOS
 * user -- and it is the table that actually holds the artifact a submission
 * consists of.
 *
 * THE GROUPING RULE
 *
 * A submission is a *session* of uploads: consecutive live files on the same
 * deliverable, by the same uploader, with no gap longer than 60 minutes. A new
 * batch starts on the first file, on any change of uploader, or on any gap over
 * the window.
 *
 * The 60-minute window is not load-bearing. Batch counts across the plausible
 * range are 7,748 (15 min) / 7,633 (60 min) / 7,580 (4 h) / 7,509 (24 h): a 3%
 * spread, so the reconstruction is insensitive to the exact choice.
 *
 * Ordering inside the window is (uploaded_at, mdcd_dlvrbl_fil_doc_id). The PK
 * tiebreak matters: without it, files sharing a timestamp order
 * nondeterministically and batch_seq would drift between runs.
 *
 * ORIGIN IS NOT FILTERED HERE
 *
 * cmt_orgn_cd splits the file table into state uploads ('S', 12,339 files /
 * 5,353 deliverables) and CMS attachments ('C', 343 files / 220 deliverables).
 * Only 'S' represents a submission; 'C' is the cms_attached state in
 * 30_document_deliverable_link_resolved.sql, which must carry a NULL submission
 * action (the no_submitted_deliverable_cms_files CHECK). Both origins are
 * emitted here, batched independently, because stg stays source-only and the
 * document loader needs the 'C' batches too. The loader filters to
 * origin_cd = 'S' when minting `Submitted Deliverable` actions.
 *
 * CORROBORATION, NOT SUBSTITUTION
 *
 * Where a `Submitted` status event (mdcd_dlvrbl_stus_cd = 3) sits near a batch,
 * it is matched and exposed, and submitted_at prefers it -- the event is the
 * system's own record of the submission instant, while batch_end_at is only the
 * last upload. Matching is mutual-nearest and 1:1 in both directions, so a
 * single event can never be claimed by two batches. 78% of `Submitted` events
 * (4,784/6,165) have a batch within the window, and batch count equals event
 * count on 71% of deliverables that have either signal, so the two sources
 * broadly agree; where they disagree the batch is the more reliable side for
 * attribution and the event is the more reliable side for timing.
 *
 * KNOWN SKEW (deliberately not corrected here)
 *
 * mdcd_dlvrbl_fil_doc.creatd_dt and mdcd_dlvrbl_stus_hstry.creatd_dt are both
 * Eastern wall-clock stored at +00, so comparing them (as this view does) is
 * internally consistent and the batch windows are correct. They are NOT true
 * UTC. This view passes them through with ::timestamptz, matching
 * 31_deliverable_resolved.sql (created_at) and 36_comment_resolved.sql, so
 * submission timestamps stay consistent with every other migrated timestamp. If
 * the pipeline ever reinterprets Eastern -> UTC, it must be done for all of
 * them at once, not here alone. (mdcd_dlvrbl_hstry, unused here, is true UTC
 * and would shift the other way.)
 *
 * WHAT THIS DOES NOT COVER
 *
 * Batch count is a floor, not a truth: 16,215 files exist but only 12,748 are
 * live, so a submission whose files were all later deleted leaves no batch (219
 * deliverables have more `Submitted` events than batches). And 40 deliverables
 * reached a submitted-or-beyond status through the CMS Override path without
 * ever being submitted -- they must NOT receive a submission action, and 8 of
 * them have no file at all. Suppressing those is the loader's job (skip the
 * `Submitted Deliverable` hop when the source has an Overridden event, codes
 * 7/10/11, and no code-3 event); this view simply produces nothing for them.
 */
SET search_path TO stg, mysql_raw, migration, public;

-- Per-file view: assigns every live, in-scope file to its upload session.
-- Consumed by the document loader to attach each document to the submission it
-- actually arrived in, and aggregated below into one row per submission.
CREATE OR REPLACE VIEW stg.deliverable_file_batch AS
WITH scoped AS (
  SELECT
    f.mdcd_dlvrbl_fil_doc_id,
    f.mdcd_dlvrbl_id,
    f.user_id,
    f.cmt_orgn_cd,
    f.upld_aftr_acptd_ind,
    f.creatd_dt::timestamptz AS uploaded_at
  FROM
    mysql_raw.mdcd_dlvrbl_fil_doc f
    JOIN stg._valid_dlvrbl_ids v ON v.dlvrbl_id = f.mdcd_dlvrbl_id
  WHERE
    f.dltd_ind = 0
    AND f.creatd_dt IS NOT NULL
),
-- Mark the first file of each session: no predecessor, a different uploader, or
-- a gap wider than the session window.
boundary AS (
  SELECT
    s.mdcd_dlvrbl_fil_doc_id,
    s.mdcd_dlvrbl_id,
    s.user_id,
    s.cmt_orgn_cd,
    s.upld_aftr_acptd_ind,
    s.uploaded_at,
    CASE WHEN lag(s.uploaded_at) OVER w IS NULL THEN
      1
    WHEN s.user_id <> lag(s.user_id) OVER w THEN
      1
    WHEN s.uploaded_at - lag(s.uploaded_at) OVER w > interval '60 minutes' THEN
      1
    ELSE
      0
    END AS is_batch_start
  FROM
    scoped s
WINDOW w AS (PARTITION BY s.mdcd_dlvrbl_id,
  s.cmt_orgn_cd ORDER BY s.uploaded_at,
  s.mdcd_dlvrbl_fil_doc_id))
SELECT
  b.mdcd_dlvrbl_fil_doc_id AS legacy_fil_doc_id,
  b.mdcd_dlvrbl_id AS legacy_dlvrbl_id,
  dm.new_uuid AS deliverable_id,
  b.user_id AS legacy_uploader_id,
  um.new_uuid AS uploader_user_id,
  b.cmt_orgn_cd AS origin_cd,
  b.upld_aftr_acptd_ind AS after_accepted_ind,
  b.uploaded_at,
  -- Running count of session starts = the session number this file belongs to.
  sum(b.is_batch_start) OVER (PARTITION BY b.mdcd_dlvrbl_id, b.cmt_orgn_cd ORDER BY b.uploaded_at, b.mdcd_dlvrbl_fil_doc_id)::int AS batch_seq
FROM
  boundary b
  JOIN migration._id_map_mdcd_dlvrbl dm ON dm.legacy_int_id = b.mdcd_dlvrbl_id
  LEFT JOIN migration._id_map_users um ON um.legacy_int_id = b.user_id;

-- One row per reconstructed submission.
CREATE OR REPLACE VIEW stg.deliverable_submission_batch AS
WITH agg AS (
  SELECT
    fb.legacy_dlvrbl_id,
    fb.deliverable_id,
    fb.origin_cd,
    fb.batch_seq,
    fb.legacy_uploader_id,
    fb.uploader_user_id,
    -- Earliest file in the session: a stable natural key for this derived
    -- event, so a future id map can mint a UUID that survives re-runs.
(array_agg(fb.legacy_fil_doc_id ORDER BY fb.uploaded_at, fb.legacy_fil_doc_id))[1] AS anchor_fil_doc_id,
    count(*)::int AS file_count,
    min(fb.uploaded_at) AS batch_start_at,
    max(fb.uploaded_at) AS batch_end_at,
    max(fb.after_accepted_ind) AS after_accepted_ind
  FROM
    stg.deliverable_file_batch fb
  GROUP BY
    fb.legacy_dlvrbl_id,
    fb.deliverable_id,
    fb.origin_cd,
    fb.batch_seq,
    fb.legacy_uploader_id,
    fb.uploader_user_id
),
-- Candidate (batch, Submitted-event) pairs within the corroboration window,
-- ranked from both sides so the match can be forced 1:1.
pairing AS (
  SELECT
    a.legacy_dlvrbl_id,
    a.origin_cd,
    a.batch_seq,
    h.mdcd_dlvrbl_stus_hstry_id AS event_id,
    h.creatd_dt::timestamptz AS event_at,
    h.creatd_user_id AS event_user_id,
    row_number() OVER (PARTITION BY h.mdcd_dlvrbl_stus_hstry_id ORDER BY abs(extract(EPOCH FROM h.creatd_dt::timestamptz - a.batch_end_at)),
      a.batch_seq) AS event_rank,
    row_number() OVER (PARTITION BY a.legacy_dlvrbl_id,
      a.origin_cd,
      a.batch_seq ORDER BY abs(extract(EPOCH FROM h.creatd_dt::timestamptz - a.batch_end_at)),
      h.mdcd_dlvrbl_stus_hstry_id) AS batch_rank
  FROM
    agg a
    JOIN mysql_raw.mdcd_dlvrbl_stus_hstry h ON h.mdcd_dlvrbl_id = a.legacy_dlvrbl_id
      AND h.mdcd_dlvrbl_stus_cd = 3
      AND h.dltd_ind = 0
      AND h.creatd_dt::timestamptz >= a.batch_end_at - interval '1 hour'
      AND h.creatd_dt::timestamptz <= a.batch_end_at + interval '24 hours'
  WHERE
    -- Only a state upload can corroborate a state submission.
    a.origin_cd = 'S'
),
-- Mutual nearest: the batch is this event's closest, and the event is that
-- batch's closest.
matched AS (
  SELECT
    p.legacy_dlvrbl_id,
    p.origin_cd,
    p.batch_seq,
    p.event_id,
    p.event_at,
    p.event_user_id
  FROM
    pairing p
  WHERE
    p.event_rank = 1
    AND p.batch_rank = 1
)
SELECT
  a.legacy_dlvrbl_id,
  a.deliverable_id,
  a.origin_cd,
  a.batch_seq,
  a.anchor_fil_doc_id,
  a.legacy_uploader_id,
  a.uploader_user_id,
  a.file_count,
  a.batch_start_at,
  a.batch_end_at,
  a.after_accepted_ind,
  m.event_id AS corroborating_status_event_id,
  m.event_at AS corroborating_status_event_at,
  m.event_user_id AS corroborating_status_event_user_id,
  -- Prefer the system's own submission instant; fall back to the last upload.
  COALESCE(m.event_at, a.batch_end_at) AS submitted_at
FROM
  agg a
  LEFT JOIN matched m ON m.legacy_dlvrbl_id = a.legacy_dlvrbl_id
    AND m.origin_cd = a.origin_cd
    AND m.batch_seq = a.batch_seq;

