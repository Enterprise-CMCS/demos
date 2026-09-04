-- CreateTable
CREATE TABLE "email_notification" (
    "id" UUID NOT NULL,
    "email_type_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "application_id" UUID,
    "reference_id" UUID,
    "reference_agreement_id" UUID,
    "deliverable_action_id" UUID,
    "public_comment_id" UUID,
    "triggered_by_user_id" UUID NOT NULL,
    "status_id" TEXT NOT NULL DEFAULT 'Pending',
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
    "application_id" UUID,
    "reference_id" UUID,
    "reference_agreement_id" UUID,
    "deliverable_action_id" UUID,
    "public_comment_id" UUID,
    "triggered_by_user_id" UUID NOT NULL,
    "status_id" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "email_notification_recipient" (
    "id" UUID NOT NULL,
    "email_notification_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_notification_recipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_notification_status" (
    "id" TEXT NOT NULL,

    CONSTRAINT "email_notification_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_notification_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "email_notification_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_notification_type_entity_type" (
    "email_type_id" TEXT NOT NULL,
    "entity_type_id" TEXT NOT NULL,

    CONSTRAINT "email_notification_type_entity_type_pkey" PRIMARY KEY ("email_type_id","entity_type_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_notification_recipient_email_notification_id_person_id_key" ON "email_notification_recipient"("email_notification_id", "person_id");

-- AddForeignKey
ALTER TABLE "email_notification" ADD CONSTRAINT "email_notification_email_type_id_entity_type_fkey" FOREIGN KEY ("email_type_id", "entity_type") REFERENCES "email_notification_type_entity_type"("email_type_id", "entity_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_notification" ADD CONSTRAINT "email_notification_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_notification" ADD CONSTRAINT "email_notification_reference_id_fkey" FOREIGN KEY ("reference_id") REFERENCES "reference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_notification" ADD CONSTRAINT "email_notification_reference_agreement_id_fkey" FOREIGN KEY ("reference_agreement_id") REFERENCES "reference_agreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_notification" ADD CONSTRAINT "email_notification_deliverable_action_id_fkey" FOREIGN KEY ("deliverable_action_id") REFERENCES "deliverable_action"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_notification" ADD CONSTRAINT "email_notification_public_comment_id_fkey" FOREIGN KEY ("public_comment_id") REFERENCES "public_comment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddCheckConstraint
ALTER TABLE "email_notification" ADD CONSTRAINT "email_notification_exactly_one_entity" CHECK (num_nonnulls("deliverable_action_id", "public_comment_id", "application_id", "reference_id", "reference_agreement_id") = 1);

-- AddCheckConstraint
ALTER TABLE "email_notification" ADD CONSTRAINT "email_notification_entity_type_matches_id" CHECK (
    CASE "entity_type"
        WHEN 'deliverable' THEN num_nonnulls("deliverable_action_id", "public_comment_id") = 1
        WHEN 'application' THEN "application_id" IS NOT NULL
        WHEN 'reference' THEN "reference_id" IS NOT NULL
        WHEN 'reference_agreement' THEN "reference_agreement_id" IS NOT NULL
        ELSE false
    END
);

-- AddCheckConstraint
ALTER TABLE "email_notification" ADD CONSTRAINT "email_notification_public_comment_type" CHECK (
    ("email_type_id" = 'Public Comment Added') = ("public_comment_id" IS NOT NULL)
);
