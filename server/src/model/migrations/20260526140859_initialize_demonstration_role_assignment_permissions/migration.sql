INSERT INTO
    demos_app.permission
VALUES
    ('View All DemonstrationRoleAssignments', 'System'),
    ('View DemonstrationRoleAssignments on Assigned Demonstrations', 'System')
;

INSERT INTO
    demos_app.role_permission
VALUES
    ('Admin User', 'System', 'View All DemonstrationRoleAssignments'),
    ('Admin User', 'System', 'View DemonstrationRoleAssignments on Assigned Demonstrations'),
    ('CMS User', 'System', 'View All DemonstrationRoleAssignments'),
    ('CMS User', 'System', 'View DemonstrationRoleAssignments on Assigned Demonstrations'),
    ('State User', 'System', 'View DemonstrationRoleAssignments on Assigned Demonstrations')
;