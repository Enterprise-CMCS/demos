SET search_path TO demos_app;

UPDATE
    demos_app.deliverable
SET
    name = trim(name)
WHERE
    name <> trim(name);


ALTER TABLE
    demos_app.deliverable
ADD CONSTRAINT
    check_deliverable_name_has_no_leading_trailing_whitespace
CHECK (
    name = trim(name)
);

