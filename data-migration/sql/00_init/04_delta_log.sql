/*
 * Purpose: Define the mysql_raw._delta_log bookkeeping table (one row per cutover) recording the freeze instant and the wall-clock time the delta finished loading; idempotent.
 * Refs:    pgloader/delta.tmpl.load
 *
 * mysql_raw._delta_log: one row per cutover dress rehearsal / production cutover.
 * freeze.py inserts a row when the freeze instant is captured; the pgloader
 * AFTER LOAD DO block in pgloader/delta.tmpl.load updates that same row with
 * the wall-clock time the delta finished loading.
 */
CREATE TABLE IF NOT EXISTS mysql_raw._delta_log(
  id serial PRIMARY KEY,
  freeze_instant timestamptz NOT NULL,
  delta_applied_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_delta_log_freeze_instant ON mysql_raw._delta_log(freeze_instant);

