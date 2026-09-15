INSERT INTO demos_app.email_notification_entity_type (id)
VALUES
('deliverable_action'),
('public_comment'),
('demonstration');


ALTER TABLE demos_app.email_notification DROP CONSTRAINT "email_notification_exactly_one_entity";

-- AddCheckConstraint
ALTER TABLE demos_app.email_notification DROP CONSTRAINT "email_notification_entity_type_matches_id";

DROP TRIGGER IF EXISTS log_changes_email_notification ON demos_app.email_notification;
DROP FUNCTION IF EXISTS demos_app.log_changes_email_notification();

CREATE FUNCTION demos_app.log_changes_email_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.email_notification_history (
            revision_type,
            id,
            email_type_id,
            entity_type,
            deliverable_id,
            application_id,
            application_type_id,
            reference_configuration_id,
            deliverable_action_id,
            public_comment_id,
            status_id,
            payload,
            sqs_message_id,
            last_error,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.id,
            NEW.email_type_id,
            NEW.entity_type,
            NEW.deliverable_id,
            NEW.application_id,
            NEW.application_type_id,
            NEW.reference_configuration_id,
            NEW.deliverable_action_id,
            NEW.public_comment_id,
            NEW.status_id,
            NEW.payload,
            NEW.sqs_message_id,
            NEW.last_error,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.email_notification_history (
            revision_type,
            id,
            email_type_id,
            entity_type,
            deliverable_id,
            application_id,
            application_type_id,
            reference_configuration_id,
            deliverable_action_id,
            public_comment_id,
            status_id,
            payload,
            sqs_message_id,
            last_error,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.email_type_id,
            OLD.entity_type,
            OLD.deliverable_id,
            OLD.application_id,
            OLD.application_type_id,
            OLD.reference_configuration_id,
            OLD.deliverable_action_id,
            OLD.public_comment_id,
            OLD.status_id,
            OLD.payload,
            OLD.sqs_message_id,
            OLD.last_error,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_changes_email_notification
AFTER INSERT OR UPDATE OR DELETE ON demos_app.email_notification
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_email_notification();

-- bridge and update existing rows to the appropriate place
INSERT INTO demos_app.email_notification_type_entity_type (email_type_id, entity_type_id)
VALUES
('Deliverable Created', 'deliverable_action'),
('Deliverable Due Date Updated', 'deliverable_action'),
('Deliverable Submitted', 'deliverable_action'),
('Deliverable Accepted', 'deliverable_action'),
('Deliverable Approved', 'deliverable_action'),
('Deliverable Received and Filed', 'deliverable_action'),
('Extension Requested', 'deliverable_action'),
('Extension Decision Made', 'deliverable_action'),
('Resubmission Requested', 'deliverable_action'),
('Deliverable Comment', 'public_comment');

UPDATE demos_app.email_notification
SET entity_type = 'deliverable_action'
WHERE email_type_id IN (
    'Deliverable Created',
    'Deliverable Due Date Updated',
    'Deliverable Submitted',
    'Deliverable Accepted',
    'Deliverable Approved',
    'Deliverable Received and Filed',
    'Extension Requested',
    'Extension Decision Made',
    'Resubmission Requested'
);

UPDATE demos_app.email_notification
SET entity_type = 'public_comment'
WHERE email_type_id IN (
    'Deliverable Comment'
);

DELETE FROM demos_app.email_notification_type_entity_type
WHERE entity_type_id = 'deliverable';

INSERT INTO demos_app.email_notification_type (id)
VALUES
('Deliverable Due Date Reminder'),
('Demonstration Expiration Date Reminder'),
('Application Expected Approval Date Reminder');

INSERT INTO demos_app.email_notification_type_entity_type (email_type_id, entity_type_id)
VALUES
('Deliverable Due Date Reminder', 'deliverable'),
('Demonstration Expiration Date Reminder', 'demonstration'),
('Application Expected Approval Date Reminder', 'application');

UPDATE demos_app.email_notification
SET application_type_id = application.application_type_id
FROM demos_app.application 
WHERE email_notification.application_id = application.id;

ALTER TABLE demos_app.email_notification ADD CONSTRAINT email_notification_exactly_one_entity
CHECK (
    num_nonnulls(
        deliverable_id,
        application_id,
        deliverable_action_id,
        public_comment_id,
        reference_configuration_id
    ) = 1
);

ALTER TABLE demos_app.email_notification ADD CONSTRAINT email_notification_application_id_requires_type CHECK (
    (application_id IS NULL) = (application_type_id IS NULL)
);

ALTER TABLE demos_app.email_notification ADD CONSTRAINT email_notification_entity_type_matches_id CHECK (
    CASE entity_type
        WHEN 'deliverable' THEN deliverable_id IS NOT NULL
        WHEN 'deliverable_action' THEN deliverable_action_id IS NOT NULL
        WHEN 'public_comment' THEN public_comment_id IS NOT NULL
        WHEN 'demonstration' THEN application_id IS NOT NULL AND application_type_id = 'Demonstration'
        WHEN 'application' THEN application_id IS NOT NULL
        WHEN 'reference' THEN reference_configuration_id IS NOT NULL
        ELSE FALSE
    END
);
