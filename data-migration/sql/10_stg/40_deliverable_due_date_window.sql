/*
 * Purpose:    Reconstruct the due date in effect at any instant for each PMDA deliverable, so a synthesized action can record the date it was actually judged against instead of today's.
 * Inputs:     mysql_raw.mdcd_dlvrbl_hstry, migration._id_map_mdcd_dlvrbl
 * Outputs:    CREATE OR REPLACE VIEW stg.deliverable_due_date_window
 * Invariants: source-only (mysql_raw + id map only); idempotent (CREATE OR REPLACE VIEW); windows tile each deliverable's timeline contiguously with no gaps and no overlaps, so at most one window matches any instant; hstry_updtd_dt is converted from true UTC to the Eastern-wall-clock-at-+00 convention every other migrated timestamp uses; rows carrying no due date at all contribute no window.
 * Refs:       sql/10_stg/39_deliverable_submission_batch.sql (KNOWN SKEW), sql/23_app_derived/60_deliverable_action.sql, docs/specs/data-dbt-alignment-spec.md (TODO 13)
 *
 * Due-date history windows for deliverables.
 *
 * mdcd_dlvrbl_hstry writes one row per change to a deliverable, each carrying
 * the due date as it stood after that change. Ordering those rows by time and
 * taking the interval up to the next one yields, for any instant, the due date
 * then in effect.
 *
 * TIMEZONE -- THE PART THAT WILL BITE
 *
 * mdcd_dlvrbl_hstry.hstry_updtd_dt is TRUE UTC. Every other timestamp this
 * pipeline migrates -- mdcd_dlvrbl_fil_doc.creatd_dt, mdcd_dlvrbl_stus_hstry
 * .creatd_dt, and therefore stg.deliverable_submission_batch.submitted_at and
 * every demos_app.deliverable_action.action_timestamp -- is Eastern wall-clock
 * stored at +00 (see the KNOWN SKEW note in 39_deliverable_submission_batch.sql).
 * Comparing the two raw would misplace every boundary by the Eastern offset.
 * Measured on the live snapshot, pairing each history row with the nearest
 * status event puts 17,476 pairs at exactly +4h and 8,950 at exactly +5h, which
 * is EDT and EST and nothing else.
 *
 * So the conversion below renders the UTC instant as Eastern wall clock and
 * re-stamps it at +00, matching the convention the action timestamps already
 * use. It is DST-aware by construction: a fixed interval would be wrong for a
 * third of the year. This deliberately does NOT reinterpret the other tables
 * into true UTC -- 39_* is explicit that if that ever happens it must happen for
 * all of them at once.
 *
 * WINDOW ALGEBRA
 *
 * Each history row carries BOTH the due date after the change (dlvrbl_due_dt)
 * and the one before it (mdcd_dlvrbl_prvs_due_dt), so n rows describe n+1
 * intervals, not n. The earliest row's prvs value opens a leading window
 * covering everything before recorded history began; without it, the first
 * recorded value would be back-projected over a period it was never in effect,
 * which is precisely the error this file exists to remove. When that prvs value
 * is NULL the period before the first row is genuinely unknown, so the first
 * recorded value is extended backwards as the only available answer.
 *
 * Bounds are finite sentinels rather than +/-infinity: psycopg raises
 * DataError on infinite timestamps, so an infinite bound would make the view
 * unreadable from the Python harnesses that verify it.
 *
 * Consecutive rows sharing one instant are collapsed to the highest history id,
 * the later write: without that, lead() would emit a zero-width window and two
 * rows would claim the same boundary, making the loader's UPDATE pick a due
 * date by physical row order. Adjacent windows carrying the same due date are
 * then merged, so the output has one row per period the date actually held.
 *
 * Note this is NOT dbt's shape. Its equivalent model coalesces prvs into the
 * post-change value and so never opens the leading window, and it partitions by
 * (deliverable, due_date) taking first_value of each edge, so a due date that
 * recurs (A -> B -> A) merges its two windows into one span overlapping B's.
 * Contiguous lead() windows with an explicit merge cannot do either.
 *
 * Scope is every deliverable in the id map, not just loaded ones, so the view
 * stays a pure projection of source history; 60_* joins demos_app.deliverable
 * and discards the rest.
 */
CREATE OR REPLACE VIEW stg.deliverable_due_date_window AS
WITH conv AS (
  SELECT
    im.new_uuid AS deliverable_id,
    h.mdcd_dlvrbl_id AS legacy_dlvrbl_id,
    h.mdcd_dlvrbl_hstry_id,
    timezone('UTC', timezone('America/New_York', h.hstry_updtd_dt)) AS changed_at,
    migration.eastern_day_start(COALESCE(h.dlvrbl_due_dt, h.mdcd_dlvrbl_prvs_due_dt)) AS due_date,
    migration.eastern_day_start(h.mdcd_dlvrbl_prvs_due_dt) AS prev_due_date
  FROM
    mysql_raw.mdcd_dlvrbl_hstry h
    JOIN migration._id_map_mdcd_dlvrbl im ON im.legacy_int_id = h.mdcd_dlvrbl_id
  WHERE
    h.hstry_updtd_dt IS NOT NULL
    AND COALESCE(h.dlvrbl_due_dt, h.mdcd_dlvrbl_prvs_due_dt) IS NOT NULL
),
deduped AS (
  SELECT DISTINCT ON (deliverable_id,
    changed_at)
    deliverable_id,
    legacy_dlvrbl_id,
    changed_at,
    due_date,
    prev_due_date
  FROM
    conv
  ORDER BY
    deliverable_id ASC,
    changed_at ASC,
    mdcd_dlvrbl_hstry_id DESC
),
sequenced AS (
  SELECT
    deliverable_id,
    legacy_dlvrbl_id,
    changed_at,
    due_date,
    prev_due_date,
    row_number() OVER w AS rn,
      lead(changed_at) OVER w AS next_changed_at
      FROM
        deduped
WINDOW w AS (PARTITION BY deliverable_id ORDER BY changed_at)
),
spans AS (
  -- The interval each recorded change opens, running to the next change.
  SELECT
    deliverable_id,
    legacy_dlvrbl_id,
    due_date,
    changed_at AS valid_from,
    COALESCE(next_changed_at, '2999-12-31 00:00:00+00'::timestamptz) AS valid_to
  FROM
    sequenced
  UNION ALL
  -- Everything before history began, from the earliest row's own record of the
  -- value it replaced. Falls back to that row's post-change value when the
  -- source did not record one.
  SELECT
    deliverable_id,
    legacy_dlvrbl_id,
    COALESCE(prev_due_date, due_date),
    '1900-01-01 00:00:00+00'::timestamptz,
    changed_at
  FROM
    sequenced
  WHERE
    rn = 1
),
lagged AS (
  SELECT
    deliverable_id,
    legacy_dlvrbl_id,
    due_date,
    valid_from,
    valid_to,
    lag(due_date) OVER (PARTITION BY deliverable_id ORDER BY valid_from) AS prev_span_due
  FROM
    spans
  WHERE
    valid_from < valid_to
),
marked AS (
  SELECT
    deliverable_id,
    legacy_dlvrbl_id,
    due_date,
    valid_from,
    valid_to,
    -- Written as a cast rather than a CASE because sqlfluff's postgres dialect
    -- cannot parse IS DISTINCT FROM inside a CASE WHEN.
(due_date IS DISTINCT FROM prev_span_due)::int AS starts_run
  FROM
    lagged
),
grouped AS (
  SELECT
    deliverable_id,
    legacy_dlvrbl_id,
    due_date,
    valid_from,
    valid_to,
    sum(starts_run) OVER (PARTITION BY deliverable_id ORDER BY valid_from ROWS UNBOUNDED PRECEDING) AS run_id
FROM
  marked
)
SELECT
  deliverable_id,
  legacy_dlvrbl_id,
  due_date,
  min(valid_from) AS valid_from,
  max(valid_to) AS valid_to
FROM
  grouped
GROUP BY
  deliverable_id,
  legacy_dlvrbl_id,
  due_date,
  run_id;

