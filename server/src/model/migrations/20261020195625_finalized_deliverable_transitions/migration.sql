
INSERT INTO
    demos_app.deliverable_action_type
VALUES
    ('Terminating Status Override', FALSE, TRUE, TRUE, TRUE)
;

INSERT INTO
    demos_app.deliverable_action_configuration
VALUES
    ('Terminating Status Override', 'Approved', 'Received and Filed'),
    ('Terminating Status Override', 'Approved', 'Accepted'),
    ('Terminating Status Override', 'Accepted', 'Approved'),
    ('Terminating Status Override', 'Accepted', 'Received and Filed'),
    ('Terminating Status Override', 'Received and Filed', 'Approved'),
    ('Terminating Status Override', 'Received and Filed', 'Accepted')
;

