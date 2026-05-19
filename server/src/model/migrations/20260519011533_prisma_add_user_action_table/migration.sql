SET search_path TO demos_app;

-- CreateTable
CREATE TABLE "user_action" (
    "id" UUID NOT NULL,
    "action_timestamp" TIMESTAMPTZ NOT NULL,
    "user_id" UUID NOT NULL,
    "person_type_id" TEXT NOT NULL,
    "action_type_id" TEXT NOT NULL,

    CONSTRAINT "user_action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_action_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "action_timestamp" TIMESTAMPTZ NOT NULL,
    "user_id" UUID NOT NULL,
    "person_type_id" TEXT NOT NULL,
    "action_type_id" TEXT NOT NULL,

    CONSTRAINT "user_action_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "user_action_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "user_action_type_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_action" ADD CONSTRAINT "user_action_user_id_person_type_id_fkey" FOREIGN KEY ("user_id", "person_type_id") REFERENCES "users"("id", "person_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_action" ADD CONSTRAINT "user_action_action_type_id_fkey" FOREIGN KEY ("action_type_id") REFERENCES "user_action_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
