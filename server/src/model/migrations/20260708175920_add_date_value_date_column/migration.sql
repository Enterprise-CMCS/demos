-- Add a plain date column alongside the existing timestamptz column.
-- This allows individual date types to be migrated from timestamps to dates
-- one at a time. Once all date types have been migrated, date_value can be
-- made nullable and eventually dropped.
-- text is used instead of the date type so that Prisma returns a plain string
-- rather than a JS Date object, avoiding timezone shift issues at the application layer.

ALTER TABLE demos_app.application_date
  ADD COLUMN plain_date text NOT NULL DEFAULT '';

ALTER TABLE demos_app.application_date_history
  ADD COLUMN plain_date text NOT NULL DEFAULT '';

-- Backfill existing rows for all date types.
-- Convert the stored timestamptz to a plain date in Eastern time.
UPDATE demos_app.application_date
SET plain_date = to_char(date_value AT TIME ZONE 'America/New_York', 'YYYY-MM-DD');

UPDATE demos_app.application_date_history
SET plain_date = to_char(date_value AT TIME ZONE 'America/New_York', 'YYYY-MM-DD');
