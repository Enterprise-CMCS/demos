-- CreateTable
CREATE TABLE "email_notification" (
    "id" UUID NOT NULL,
    "email_type_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "source_action_id" UUID,
    "triggered_by_user_id" UUID NOT NULL,
    "status_id" TEXT NOT NULL DEFAULT 'Pending',
    "idempotency_key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sqs_message_id" TEXT,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "email_notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_notification_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "email_type_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "source_action_id" UUID,
    "triggered_by_user_id" UUID NOT NULL,
    "status_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sqs_message_id" TEXT,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "email_notification_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "email_notification_entity_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "email_notification_entity_type_pkey" PRIMARY KEY ("id")
);

INSERT INTO "email_notification_entity_type" ("id")
VALUES
    ('deliverable'),
    ('application');

-- CreateTable
CREATE TABLE "email_notification_recipient" (
    "id" UUID NOT NULL,
    "email_notification_id" UUID NOT NULL,
    "person_id" UUID,
    "email_address" TEXT NOT NULL,
    "normalized_email" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_notification_recipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_notification_status" (
    "id" TEXT NOT NULL,

    CONSTRAINT "email_notification_status_pkey" PRIMARY KEY ("id")
);

INSERT INTO "email_notification_status" ("id")
VALUES
    ('Pending'),
    ('Queued'),
    ('Sent'),
    ('Failed');

-- CreateTable
CREATE TABLE "email_notification_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "email_notification_type_pkey" PRIMARY KEY ("id")
);

INSERT INTO "email_notification_type" ("id")
VALUES
    ('Deliverable Created'),
    ('Multiple Deliverables Created'),
    ('Deliverable Submitted'),
    ('Deliverable Accepted'),
    ('Deliverable Approved'),
    ('Deliverable Received and Filed'),
    ('Deliverable Due Date Updated'),
    ('Extension Requested'),
    ('Extension Decision Made'),
    ('Resubmission Requested'),
    ('Public Comment Added'),
    ('Application Status Updated');

-- CreateTable
CREATE TABLE "email_notification_type_entity_type" (
    "email_type_id" TEXT NOT NULL,
    "entity_type_id" TEXT NOT NULL,

    CONSTRAINT "email_notification_type_entity_type_pkey" PRIMARY KEY ("email_type_id","entity_type_id")
);

INSERT INTO "email_notification_type_entity_type" ("email_type_id", "entity_type_id")
VALUES
    ('Deliverable Created', 'deliverable'),
    ('Multiple Deliverables Created', 'deliverable'),
    ('Deliverable Due Date Updated', 'deliverable'),
    ('Deliverable Submitted', 'deliverable'),
    ('Deliverable Accepted', 'deliverable'),
    ('Deliverable Approved', 'deliverable'),
    ('Deliverable Received and Filed', 'deliverable'),
    ('Extension Requested', 'deliverable'),
    ('Extension Decision Made', 'deliverable'),
    ('Resubmission Requested', 'deliverable'),
    ('Public Comment Added', 'deliverable'),
    ('Application Status Updated', 'application');

-- CreateIndex
CREATE UNIQUE INDEX "email_notification_idempotency_key_key" ON "email_notification"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "email_notification_recipient_email_notification_id_normaliz_key" ON "email_notification_recipient"("email_notification_id", "normalized_email");

-- AddForeignKey
ALTER TABLE "email_notification" ADD CONSTRAINT "email_notification_email_type_id_entity_type_fkey" FOREIGN KEY ("email_type_id", "entity_type") REFERENCES "email_notification_type_entity_type"("email_type_id", "entity_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_notification" ADD CONSTRAINT "email_notification_source_action_id_fkey" FOREIGN KEY ("source_action_id") REFERENCES "deliverable_action"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_notification" ADD CONSTRAINT "email_notification_triggered_by_user_id_fkey" FOREIGN KEY ("triggered_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_notification" ADD CONSTRAINT "email_notification_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "email_notification_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_notification_recipient" ADD CONSTRAINT "email_notification_recipient_email_notification_id_fkey" FOREIGN KEY ("email_notification_id") REFERENCES "email_notification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_notification_recipient" ADD CONSTRAINT "email_notification_recipient_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_notification_type_entity_type" ADD CONSTRAINT "email_notification_type_entity_type_email_type_id_fkey" FOREIGN KEY ("email_type_id") REFERENCES "email_notification_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_notification_type_entity_type" ADD CONSTRAINT "email_notification_type_entity_type_entity_type_id_fkey" FOREIGN KEY ("entity_type_id") REFERENCES "email_notification_entity_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
