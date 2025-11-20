INSERT INTO
    demos_app.application_phase_type_limit
VALUES
    ('Concept'),
    ('Application Intake'),
    ('Completeness'),
    ('Federal Comment'),
    ('SDG Preparation'),
    ('OGC & OMB Review'),
    ('Approval Package'),
    ('Post Approval');

INSERT INTO
    demos_app.date_type
VALUES
    ('Concept Skipped Date'),
    ('Approval Package Start Date'),
    ('Approval Package Completion Date');

INSERT INTO
    demos_app.phase_date_type
VALUES
    ('Concept', 'Concept Skipped Date'),
    ('Approval Package', 'Approval Package Start Date'),
    ('Approval Package', 'Approval Package Completion Date');
