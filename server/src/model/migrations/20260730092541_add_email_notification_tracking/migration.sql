CREATE TABLE demos_app.email_notification_status (
    id TEXT NOT NULL,

    CONSTRAINT email_notification_status_pkey PRIMARY KEY (id)
);

INSERT INTO demos_app.email_notification_status (id)
VALUES
    ('Pending'),
    ('Queued'),
    ('Failed')
;

CREATE TABLE demos_app.email_notification_type (
    id TEXT NOT NULL,

    CONSTRAINT email_notification_type_pkey PRIMARY KEY (id)
);

INSERT INTO demos_app.email_notification_type (id)
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
    ('Terms And Conditions Requested'),
    ('Application Status Updated')
;

CREATE TABLE demos_app.email_notification (
    id UUID NOT NULL,
    email_type_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    source_action_id UUID,
    triggered_by_user_id UUID NOT NULL,
    status_id TEXT NOT NULL DEFAULT 'Pending',
    idempotency_key TEXT NOT NULL,
    payload JSONB NOT NULL,
    sqs_message_id TEXT,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT email_notification_pkey PRIMARY KEY (id),
    CONSTRAINT email_notification_email_type_id_fkey
        FOREIGN KEY (email_type_id)
        REFERENCES demos_app.email_notification_type (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT email_notification_source_action_id_fkey
        FOREIGN KEY (source_action_id)
        REFERENCES demos_app.deliverable_action (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT email_notification_triggered_by_user_id_fkey
        FOREIGN KEY (triggered_by_user_id)
        REFERENCES demos_app.users (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT email_notification_status_id_fkey
        FOREIGN KEY (status_id)
        REFERENCES demos_app.email_notification_status (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE UNIQUE INDEX email_notification_idempotency_key_key
ON demos_app.email_notification (idempotency_key);

CREATE TABLE demos_app.email_notification_history (
    revision_id SERIAL NOT NULL,
    revision_type demos_app.revision_type_enum NOT NULL,
    modified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id UUID NOT NULL,
    email_type_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    source_action_id UUID,
    triggered_by_user_id UUID NOT NULL,
    status_id TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    payload JSONB NOT NULL,
    sqs_message_id TEXT,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT email_notification_history_pkey PRIMARY KEY (revision_id)
);

CREATE TABLE demos_app.email_notification_recipient (
    id UUID NOT NULL,
    email_notification_id UUID NOT NULL,
    person_id UUID,
    email_address TEXT NOT NULL,
    normalized_email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT email_notification_recipient_pkey PRIMARY KEY (id),
    CONSTRAINT email_notification_recipient_email_notification_id_fkey
        FOREIGN KEY (email_notification_id)
        REFERENCES demos_app.email_notification (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT email_notification_recipient_person_id_fkey
        FOREIGN KEY (person_id)
        REFERENCES demos_app.person (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE UNIQUE INDEX email_notification_recipient_email_notification_id_normalized_email_key
ON demos_app.email_notification_recipient (email_notification_id, normalized_email);
