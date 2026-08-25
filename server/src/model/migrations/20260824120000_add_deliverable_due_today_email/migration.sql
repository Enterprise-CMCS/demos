ALTER TABLE demos_app.email_notification
ALTER COLUMN triggered_by_user_id DROP NOT NULL;

ALTER TABLE demos_app.email_notification_history
ALTER COLUMN triggered_by_user_id DROP NOT NULL;

INSERT INTO demos_app.email_notification_type (id)
VALUES ('Deliverable Due Today');

INSERT INTO demos_app.email_notification_type_entity_type (email_type_id, entity_type_id)
VALUES ('Deliverable Due Today', 'deliverable');
