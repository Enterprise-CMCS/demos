-- Renamed to distinguish CMS's internal target from the date the state requested.
--
-- The date_type foreign keys are ON UPDATE CASCADE, so application_date and
-- phase_date_type rows follow this rename automatically. That cascade is a real
-- UPDATE on application_date, which would fire log_changes_application_date and
-- write a spurious "edited" revision for every application that has this date.
-- Suppress the trigger for the rename, then relabel the existing history rows so
-- they still join to date_type. Prisma runs this file in a transaction, so the
-- trigger is re-enabled even if a later statement fails.
ALTER TABLE demos_app.application_date DISABLE TRIGGER log_changes_application_date;

UPDATE
    demos_app.date_type
SET
    id = 'Internal Expected Approval Date'
WHERE
    id = 'Expected Approval Date'
;

UPDATE
    demos_app.application_date_history
SET
    date_type_id = 'Internal Expected Approval Date'
WHERE
    date_type_id = 'Expected Approval Date'
;

ALTER TABLE demos_app.application_date ENABLE TRIGGER log_changes_application_date;

INSERT INTO
    demos_app.date_type
VALUES
    ('State Requested Approval Date');

INSERT INTO
    demos_app.phase_date_type
VALUES
    ('SDG Preparation', 'State Requested Approval Date');
