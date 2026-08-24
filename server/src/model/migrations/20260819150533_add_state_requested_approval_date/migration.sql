-- Renamed to distinguish CMS's internal target from the date the state requested.
-- The date_type foreign keys are ON UPDATE CASCADE, so application_date and
-- phase_date_type rows follow this rename.
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
