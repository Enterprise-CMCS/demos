INSERT INTO
    demos_app.date_type
VALUES
    ('Package Sent for COMMs Clearance'),
    ('COMMs Clearance Received'),
    ('Submit Approval Package to OSORA'),
    ('OSORA R1 Comments Due'),
    ('OSORA R2 Comments Due'),
    ('CMS (OSORA) Clearance End');

INSERT INTO
    demos_app.phase_date_type
VALUES
    ('Review', 'Package Sent for COMMs Clearance'),
    ('Review', 'COMMs Clearance Received'),
    ('Review', 'Submit Approval Package to OSORA'),
    ('Review', 'OSORA R1 Comments Due'),
    ('Review', 'OSORA R2 Comments Due'),
    ('Review', 'CMS (OSORA) Clearance End');

DELETE FROM
    demos_app.phase_date_type
WHERE
    phase_id = 'Review'
    AND date_type_id IN (
        'PO & OGD Sign-Off',
        'OGC Review Complete',
        'OMB Review Complete'
    );

DELETE FROM
    demos_app.date_type
WHERE
    id IN (
        'PO & OGD Sign-Off',
        'OGC Review Complete',
        'OMB Review Complete'
    );
