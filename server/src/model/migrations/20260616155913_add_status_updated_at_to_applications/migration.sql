-- Add columns to the tables
ALTER TABLE demos_app.amendment ADD COLUMN status_updated_at TIMESTAMPTZ;
ALTER TABLE demos_app.amendment_history ADD COLUMN status_updated_at TIMESTAMPTZ;
ALTER TABLE demos_app.demonstration ADD COLUMN status_updated_at TIMESTAMPTZ;
ALTER TABLE demos_app.demonstration_history ADD COLUMN status_updated_at TIMESTAMPTZ;
ALTER TABLE demos_app.extension ADD COLUMN status_updated_at TIMESTAMPTZ;
ALTER TABLE demos_app.extension_history ADD COLUMN status_updated_at TIMESTAMPTZ;

-- Set values for all the fields
-- Just using the updated_at of the record
-- Not correct, but acceptable in pre-production, avoids a reset for now
UPDATE
    demos_app.amendment AS amd
SET
    status_updated_at = amd.updated_at;

UPDATE
    demos_app.amendment_history AS amd_hist
SET
    status_updated_at = amd_hist.updated_at;

UPDATE
    demos_app.demonstration AS demo
SET
    status_updated_at = demo.updated_at;

UPDATE
    demos_app.demonstration_history AS demo_hist
SET
    status_updated_at = demo_hist.updated_at;

UPDATE
    demos_app.extension AS ext
SET
    status_updated_at = ext.updated_at;

UPDATE
    demos_app.extension_history AS ext_hist
SET
    status_updated_at = ext_hist.updated_at;

-- Now, make field not null
ALTER TABLE demos_app.amendment ALTER COLUMN status_updated_at SET NOT NULL;
ALTER TABLE demos_app.amendment_history ALTER COLUMN status_updated_at SET NOT NULL;
ALTER TABLE demos_app.demonstration ALTER COLUMN status_updated_at SET NOT NULL;
ALTER TABLE demos_app.demonstration_history ALTER COLUMN status_updated_at SET NOT NULL;
ALTER TABLE demos_app.extension ALTER COLUMN status_updated_at SET NOT NULL;
ALTER TABLE demos_app.extension_history ALTER COLUMN status_updated_at SET NOT NULL;

-- And make defaults for the main tables
ALTER TABLE demos_app.amendment ALTER COLUMN status_updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE demos_app.demonstration ALTER COLUMN status_updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE demos_app.extension ALTER COLUMN status_updated_at SET DEFAULT CURRENT_TIMESTAMP;
