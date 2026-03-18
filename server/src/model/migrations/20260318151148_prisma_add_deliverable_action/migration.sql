SET search_path TO demos_app;

-- CreateTable
CREATE TABLE "deliverable_action" (
    "id" UUID NOT NULL,
    "action_timestamp" TIMESTAMPTZ NOT NULL,
    "deliverable_id" UUID NOT NULL,
    "action_type_id" TEXT NOT NULL,
    "old_status_id" TEXT NOT NULL,
    "new_status_id" TEXT NOT NULL,
    "note" TEXT,
    "active_extension_id" UUID,
    "due_date_change_allowed" BOOLEAN NOT NULL,
    "old_due_date" TIMESTAMPTZ NOT NULL,
    "new_due_date" TIMESTAMPTZ NOT NULL,
    "user_id" UUID,

    CONSTRAINT "deliverable_action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_action_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "action_timestamp" TIMESTAMPTZ NOT NULL,
    "deliverable_id" UUID NOT NULL,
    "action_type_id" TEXT NOT NULL,
    "old_status_id" TEXT NOT NULL,
    "new_status_id" TEXT NOT NULL,
    "note" TEXT,
    "active_extension_id" UUID,
    "due_date_change_allowed" BOOLEAN NOT NULL,
    "old_due_date" TIMESTAMPTZ NOT NULL,
    "new_due_date" TIMESTAMPTZ NOT NULL,
    "user_id" UUID,

    CONSTRAINT "deliverable_action_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "deliverable_action_configuration" (
    "action_type_id" TEXT NOT NULL,
    "old_status_id" TEXT NOT NULL,
    "new_status_id" TEXT NOT NULL,

    CONSTRAINT "deliverable_action_configuration_pkey" PRIMARY KEY ("action_type_id","old_status_id","new_status_id")
);

-- CreateTable
CREATE TABLE "deliverable_action_type" (
    "id" TEXT NOT NULL,
    "due_date_change_allowed" BOOLEAN NOT NULL,

    CONSTRAINT "deliverable_action_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_extension" (
    "id" UUID NOT NULL,
    "deliverable_id" UUID NOT NULL,
    "status_id" TEXT NOT NULL,
    "reason_code_id" TEXT NOT NULL,
    "note" TEXT,
    "original_date_requested" TIMESTAMPTZ NOT NULL,
    "final_date_granted" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "deliverable_extension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_extension_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "deliverable_id" UUID NOT NULL,
    "status_id" TEXT NOT NULL,
    "reason_code_id" TEXT NOT NULL,
    "note" TEXT,
    "original_date_requested" TIMESTAMPTZ NOT NULL,
    "final_date_granted" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "deliverable_extension_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "deliverable_extension_reason_code" (
    "id" TEXT NOT NULL,

    CONSTRAINT "deliverable_extension_reason_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_extension_status" (
    "id" TEXT NOT NULL,

    CONSTRAINT "deliverable_extension_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deliverable_action_id_action_type_id_key" ON "deliverable_action"("id", "action_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "deliverable_action_type_id_due_date_change_allowed_key" ON "deliverable_action_type"("id", "due_date_change_allowed");

-- CreateIndex
CREATE UNIQUE INDEX "deliverable_extension_id_deliverable_id_status_id_key" ON "deliverable_extension"("id", "deliverable_id", "status_id");

-- CreateIndex
CREATE UNIQUE INDEX "deliverable_extension_id_deliverable_id_key" ON "deliverable_extension"("id", "deliverable_id");

-- AddForeignKey
ALTER TABLE "deliverable_action" ADD CONSTRAINT "deliverable_action_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_action" ADD CONSTRAINT "deliverable_action_active_extension_id_deliverable_id_fkey" FOREIGN KEY ("active_extension_id", "deliverable_id") REFERENCES "deliverable_extension"("id", "deliverable_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_action" ADD CONSTRAINT "deliverable_action_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_action" ADD CONSTRAINT "deliverable_action_action_type_id_due_date_change_allowed_fkey" FOREIGN KEY ("action_type_id", "due_date_change_allowed") REFERENCES "deliverable_action_type"("id", "due_date_change_allowed") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_action" ADD CONSTRAINT "deliverable_action_action_type_id_old_status_id_new_status_fkey" FOREIGN KEY ("action_type_id", "old_status_id", "new_status_id") REFERENCES "deliverable_action_configuration"("action_type_id", "old_status_id", "new_status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_action_configuration" ADD CONSTRAINT "deliverable_action_configuration_action_type_id_fkey" FOREIGN KEY ("action_type_id") REFERENCES "deliverable_action_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_action_configuration" ADD CONSTRAINT "deliverable_action_configuration_old_status_id_fkey" FOREIGN KEY ("old_status_id") REFERENCES "deliverable_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_action_configuration" ADD CONSTRAINT "deliverable_action_configuration_new_status_id_fkey" FOREIGN KEY ("new_status_id") REFERENCES "deliverable_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_extension" ADD CONSTRAINT "deliverable_extension_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_extension" ADD CONSTRAINT "deliverable_extension_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "deliverable_extension_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_extension" ADD CONSTRAINT "deliverable_extension_reason_code_id_fkey" FOREIGN KEY ("reason_code_id") REFERENCES "deliverable_extension_reason_code"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
