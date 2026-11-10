-- CreateTable
CREATE TABLE "application_action" (
    "id" UUID NOT NULL,
    "action_timestamp" TIMESTAMPTZ NOT NULL,
    "application_id" UUID NOT NULL,
    "action_type_id" TEXT NOT NULL,
    "date_type_id" TEXT,
    "should_have_user_id" BOOLEAN NOT NULL,
    "should_have_date_type_id" BOOLEAN NOT NULL,
    "user_id" UUID,

    CONSTRAINT "application_action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_action_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "action_timestamp" TIMESTAMPTZ NOT NULL,
    "application_id" UUID NOT NULL,
    "action_type_id" TEXT NOT NULL,
    "date_type_id" UUID,
    "should_have_user_id" BOOLEAN NOT NULL,
    "should_have_date_type_id" BOOLEAN NOT NULL,
    "user_id" UUID,

    CONSTRAINT "application_action_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "application_action_type" (
    "id" TEXT NOT NULL,
    "should_have_user_id" BOOLEAN NOT NULL,
    "should_have_date_type_id" BOOLEAN NOT NULL,

    CONSTRAINT "application_action_type_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "application_action_id_action_type_id_key" ON "application_action"("id", "action_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "application_action_type_id_should_have_user_id_should_have__key" ON "application_action_type"("id", "should_have_user_id", "should_have_date_type_id");

-- AddForeignKey
ALTER TABLE "application_action" ADD CONSTRAINT "application_action_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_action" ADD CONSTRAINT "application_action_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_action" ADD CONSTRAINT "application_action_date_type_id_fkey" FOREIGN KEY ("date_type_id") REFERENCES "date_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_action" ADD CONSTRAINT "application_action_action_type_id_should_have_user_id_shou_fkey" FOREIGN KEY ("action_type_id", "should_have_user_id", "should_have_date_type_id") REFERENCES "application_action_type"("id", "should_have_user_id", "should_have_date_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE
    demos_app.application_action
ADD CONSTRAINT
    require_user_id_for_user_actions
CHECK (
    (should_have_user_id = FALSE AND user_id IS NULL) OR (should_have_user_id = TRUE AND user_id IS NOT NULL)
);


ALTER TABLE
    demos_app.application_action
ADD CONSTRAINT
    require_date_type_id_for_date_actions
CHECK (
    (should_have_date_type_id = FALSE AND date_type_id IS NULL) OR (should_have_date_type_id = TRUE AND date_type_id IS NOT NULL)
);

INSERT INTO demos_app.application_action_type (
    id, 
    should_have_user_id, 
    should_have_date_type_id
) VALUES
    ('Set Application Date', TRUE, TRUE),
    ('Deleted Application Date', TRUE, TRUE)
;
