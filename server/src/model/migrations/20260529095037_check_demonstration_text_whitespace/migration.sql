SET search_path TO demos_app;

UPDATE
    demos_app.demonstration
SET
    name = trim(name)
WHERE
    name <> trim(name);

UPDATE
    demos_app.demonstration
SET
    description = trim(description)
WHERE
    description IS NOT NULL
    AND description <> trim(description);

ALTER TABLE
    demos_app.demonstration
ADD CONSTRAINT
    check_demonstration_name_trimmed
CHECK (
    name = trim(name)
);

ALTER TABLE
    demos_app.demonstration
ADD CONSTRAINT
    check_demonstration_description_trimmed
CHECK (
    description IS NULL
    OR description = trim(description)
);
