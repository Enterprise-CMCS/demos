SET search_path TO demos_app;

-- Add columns without restrictions initially
ALTER TABLE
    demos_app.demonstration
ADD COLUMN medicaid_id TEXT,
ADD COLUMN chip_id TEXT;

ALTER TABLE
    demos_app.demonstration_history
ADD COLUMN medicaid_id TEXT,
ADD COLUMN chip_id TEXT;

-- Create the sequences
CREATE SEQUENCE
    demos_app.medicaid_id_number_seq
START WITH
    11000
INCREMENT BY
    1
MINVALUE
    11000
MAXVALUE
    99999
NO CYCLE;

CREATE SEQUENCE
    demos_app.chip_id_number_seq
START WITH
    1000
INCREMENT BY
    1
MINVALUE
    1000
MAXVALUE
    99999
NO CYCLE;

-- Disabling triggers during the backfill
-- Necessary to conditionally do this because sometimes these triggers won't exist
-- For instance: in the Prisma Shadow DB or if doing a full DB reset
-- Note that this isn't necessarily how we would handle in production re: dropping the history
-- This case is unique
DO
$$
BEGIN
    ALTER TABLE demos_app.demonstration DISABLE TRIGGER log_changes_demonstration;
    EXCEPTION WHEN undefined_object THEN NULL;
END
$$;

DO
$$
BEGIN
    ALTER TABLE demos_app.demonstration DISABLE TRIGGER _disable_redundant_updates;
    EXCEPTION WHEN undefined_object THEN NULL;
END
$$;

-- Now, put generated IDs on all existing records
WITH new_medicaid_chip_ids AS (
    SELECT
        d.id,
        format('11-W-%s/%s', lpad(nextval('demos_app.medicaid_id_number_seq')::TEXT, 5, '0'), s.region) AS new_medicaid_id,
        format('21-W-%s/%s', lpad(nextval('demos_app.chip_id_number_seq')::TEXT, 5, '0'), s.region) AS new_chip_id
    FROM
        demos_app.demonstration AS d
    INNER JOIN
        demos_app.state AS s ON
            d.state_id = s.id
)
UPDATE
    demos_app.demonstration AS d
SET
    medicaid_id = n.new_medicaid_id,
    chip_id = n.new_chip_id
FROM
    new_medicaid_chip_ids AS n
WHERE
    d.id = n.id;

WITH new_medicaid_chip_ids AS (
    SELECT
        dh.id,
        format('11-W-%s/%s', lpad(nextval('demos_app.medicaid_id_number_seq')::TEXT, 5, '0'), s.region) AS new_medicaid_id,
        format('21-W-%s/%s', lpad(nextval('demos_app.chip_id_number_seq')::TEXT, 5, '0'), s.region) AS new_chip_id
    FROM
        demos_app.demonstration_history AS dh
    INNER JOIN
        demos_app.state AS s ON
            dh.state_id = s.id
)
UPDATE
    demos_app.demonstration_history AS dh
SET
    medicaid_id = n.new_medicaid_id,
    chip_id = n.new_chip_id
FROM
    new_medicaid_chip_ids AS n
WHERE
    dh.id = n.id;

-- Enable triggers now that the backfill is done
-- Same conditional as before
DO
$$
BEGIN
    ALTER TABLE demos_app.demonstration ENABLE TRIGGER log_changes_demonstration;
    EXCEPTION WHEN undefined_object THEN NULL;
END
$$;

DO
$$
BEGIN
    ALTER TABLE demos_app.demonstration ENABLE TRIGGER _disable_redundant_updates;
    EXCEPTION WHEN undefined_object THEN NULL;
END
$$;

-- Enabling rules again
ALTER TABLE
    demos_app.demonstration
ALTER COLUMN medicaid_id SET NOT NULL,
ALTER COLUMN chip_id SET NOT NULL;

ALTER TABLE
    demos_app.demonstration_history
ALTER COLUMN medicaid_id SET NOT NULL,
ALTER COLUMN chip_id SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX demonstration_medicaid_id_key ON demos_app.demonstration(medicaid_id);

-- CreateIndex
CREATE UNIQUE INDEX demonstration_chip_id_key ON demos_app.demonstration(chip_id);
