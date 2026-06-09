DELETE FROM demos_app.role_permission
WHERE permission_id IN (
    'View Documents on Assigned Demonstrations',
    'View Owned Documents'
);

DELETE FROM demos_app.permission
WHERE id IN (
    'View Documents on Assigned Demonstrations',
    'View Owned Documents'
);

INSERT INTO
    demos_app.permission
VALUES
    ('View Documents on Assigned Deliverables', 'System'),
    ('Edit All Documents', 'System'),
    ('Edit State Documents on Assigned Deliverables', 'System'),
    ('Delete All Documents', 'System'),
    ('Delete State Documents on Assigned Deliverables', 'System')
;

INSERT INTO
    demos_app.role_permission
VALUES
    ('Admin User', 'System', 'View Documents on Assigned Deliverables'),
    ('Admin User', 'System', 'Edit All Documents'),
    ('Admin User', 'System', 'Edit State Documents on Assigned Deliverables'),
    ('Admin User', 'System', 'Delete All Documents'),
    ('Admin User', 'System', 'Delete State Documents on Assigned Deliverables'),
    ('CMS User', 'System', 'View Documents on Assigned Deliverables'),
    ('CMS User', 'System', 'Edit All Documents'),
    ('CMS User', 'System', 'Edit State Documents on Assigned Deliverables'),
    ('CMS User', 'System', 'Delete All Documents'),
    ('CMS User', 'System', 'Delete State Documents on Assigned Deliverables'),
    ('State User', 'System', 'View Documents on Assigned Deliverables'),
    ('State User', 'System', 'Edit State Documents on Assigned Deliverables'),
    ('State User', 'System', 'Delete State Documents on Assigned Deliverables')
;
