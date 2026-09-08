INSERT INTO
    demos_app.permission
VALUES
    -- Row Level Permissions
    ('Generate On-Demand Report', 'System')
;

INSERT INTO
    demos_app.role_permission
VALUES
    ('Admin User', 'System', 'Generate On-Demand Report'),
    ('CMS User', 'System', 'Generate On-Demand Report'),
    ('Restricted CMS User', 'System', 'Generate On-Demand Report')
;
