INSERT INTO
    demos_app.permission
VALUES
    ('Access Admin Field', 'System'),
    ('Access Admin Query', 'System'),
    ('Perform Admin Action', 'System')
;

INSERT INTO
    demos_app.role_permission
VALUES
    ('Admin User', 'System', 'Access Admin Field'),
    ('Admin User', 'System', 'Access Admin Query'),
    ('Admin User', 'System', 'Perform Admin Action')
;
