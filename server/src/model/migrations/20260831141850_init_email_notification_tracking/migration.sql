INSERT INTO demos_app.email_notification_entity_type ("id")
VALUES
    ('deliverable'),
    ('application'),
    ('reference');

INSERT INTO demos_app.email_notification_status ("id")
VALUES
    ('Pending'),
    ('Queued'),
    ('Sent'),
    ('Failed');

INSERT INTO demos_app.email_notification_type ("id")
VALUES
    ('Deliverable Created'),
    ('Deliverable Submitted'),
    ('Deliverable Accepted'),
    ('Deliverable Approved'),
    ('Deliverable Received and Filed'),
    ('Deliverable Due Date Updated'),
    ('Extension Requested'),
    ('Extension Decision Made'),
    ('Resubmission Requested'),
    ('Public Comment Added'),
    ('Application Status Updated'),
    ('Terms And Conditions Requested');

INSERT INTO demos_app.email_notification_type_entity_type ("email_type_id", "entity_type_id")
VALUES
    ('Deliverable Created', 'deliverable'),
    ('Deliverable Due Date Updated', 'deliverable'),
    ('Deliverable Submitted', 'deliverable'),
    ('Deliverable Accepted', 'deliverable'),
    ('Deliverable Approved', 'deliverable'),
    ('Deliverable Received and Filed', 'deliverable'),
    ('Extension Requested', 'deliverable'),
    ('Extension Decision Made', 'deliverable'),
    ('Resubmission Requested', 'deliverable'),
    ('Public Comment Added', 'deliverable'),
    ('Application Status Updated', 'application'),
    ('Terms And Conditions Requested', 'application'),
    ('Terms And Conditions Requested', 'reference');
