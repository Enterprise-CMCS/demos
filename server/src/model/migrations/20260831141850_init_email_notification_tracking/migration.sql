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
    ('Deliverable Comment'),
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
    ('Deliverable Comment', 'deliverable'),
    ('Application Status Updated', 'application'),
    ('Terms And Conditions Requested', 'application'),
    ('Terms And Conditions Requested', 'reference');

-- AddCheckConstraint
ALTER TABLE demos_app.email_notification ADD CONSTRAINT "email_notification_exactly_one_entity" CHECK (num_nonnulls("deliverable_action_id", "public_comment_id", "application_id", "reference_configuration_id") = 1);

-- AddCheckConstraint
ALTER TABLE demos_app.email_notification ADD CONSTRAINT "email_notification_entity_type_matches_id" CHECK (
    CASE "entity_type"
        WHEN 'deliverable' THEN num_nonnulls("deliverable_action_id", "public_comment_id") = 1
        WHEN 'application' THEN "application_id" IS NOT NULL
        WHEN 'reference' THEN "reference_configuration_id" IS NOT NULL
        ELSE false
    END
);
