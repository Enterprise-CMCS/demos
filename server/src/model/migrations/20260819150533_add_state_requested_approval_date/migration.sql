-- Renamed to distinguish CMS's internal target from the date the state requested.
--
-- The date_type foreign keys are ON UPDATE CASCADE, so application_date and
-- phase_date_type rows follow this rename automatically. That cascade is a real
-- UPDATE on application_date, so it fires log_changes_application_date and records
-- a revision per affected row. That is intentional: the _history tables are raw
-- audit logs of insert/update/delete operations, and the rename is genuinely an
-- update on the table. Pre-rename history rows keep the old date_type_id, which is
-- readable on its own since these are natural keys.
UPDATE
    demos_app.date_type
SET
    id = 'Internal Expected Approval Date'
WHERE
    id = 'Expected Approval Date'
;

INSERT INTO
    demos_app.date_type
VALUES
    ('State Requested Approval Date');

INSERT INTO
    demos_app.phase_date_type
VALUES
    ('SDG Preparation', 'State Requested Approval Date');
