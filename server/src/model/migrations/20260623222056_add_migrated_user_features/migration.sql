SET search_path TO demos_app;

-- Add columns to tables and drop not null constraints
ALTER TABLE
    demos_app.users
ADD COLUMN
    is_migrated_from_pmda BOOLEAN,
ADD COLUMN
    has_logged_in BOOLEAN,
ALTER COLUMN
    cognito_subject DROP NOT NULL,
ALTER COLUMN
    username DROP NOT NULL;

ALTER TABLE
    demos_app.users_history
ADD COLUMN
    is_migrated_from_pmda BOOLEAN,
ADD COLUMN
    has_logged_in BOOLEAN,
ALTER COLUMN
    cognito_subject DROP NOT NULL,
ALTER COLUMN
    username DROP NOT NULL;

-- Disable history logging for now
-- Necessary to conditionally do this because sometimes these triggers won't exist
DO
$$
BEGIN
    ALTER TABLE demos_app.users DISABLE TRIGGER log_changes_users;
    EXCEPTION WHEN undefined_object THEN NULL;
END
$$;

-- Fill in missing data
-- Right now there are no migrated users so this is fine
UPDATE
    demos_app.users
SET
    is_migrated_from_pmda = FALSE,
    has_logged_in = TRUE;

UPDATE
    demos_app.users_history
SET
    is_migrated_from_pmda = FALSE,
    has_logged_in = TRUE;

-- Enable triggers now that the backfill is done
-- Same conditional as before
DO
$$
BEGIN
    ALTER TABLE demos_app.users ENABLE TRIGGER log_changes_users;
    EXCEPTION WHEN undefined_object THEN NULL;
END
$$;

-- Enable not null on the affected columns now that data is present
ALTER TABLE
    demos_app.users
ALTER COLUMN
    is_migrated_from_pmda SET NOT NULL,
ALTER COLUMN
    has_logged_in SET NOT NULL;

ALTER TABLE
    demos_app.users_history
ALTER COLUMN
    is_migrated_from_pmda SET NOT NULL,
ALTER COLUMN
    has_logged_in SET NOT NULL;

-- Add unique index
-- Keeping the generated Prisma code here
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- Add required check constraints
ALTER TABLE
    demos_app.users
ADD CONSTRAINT
    check_external_fields_exist_for_logged_in_users
CHECK (
    (
        has_logged_in
        AND (
            cognito_subject IS NOT NULL
            AND username IS NOT NULL
        )
    ) OR (
        NOT has_logged_in AND (
            cognito_subject IS NULL
            AND username IS NULL
        )
    )
);

ALTER TABLE
    demos_app.users
ADD CONSTRAINT
    check_all_regular_users_are_logged_in
CHECK (
    (NOT is_migrated_from_pmda AND has_logged_in) OR (is_migrated_from_pmda)
);
