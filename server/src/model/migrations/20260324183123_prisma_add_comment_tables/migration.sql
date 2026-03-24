SET search_path TO demos_app;

-- DropForeignKey
ALTER TABLE "deliverable_action" DROP CONSTRAINT "deliverable_action_user_id_fkey";

-- DropForeignKey
ALTER TABLE "document" DROP CONSTRAINT "document_deliverable_submission_action_id_deliverable_subm_fkey";

-- DropForeignKey
ALTER TABLE "document" DROP CONSTRAINT "document_deliverable_submission_action_type_id_fkey";

-- CreateTable
CREATE TABLE "private_comment" (
    "id" UUID NOT NULL,
    "deliverable_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "author_person_type_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "private_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "private_comment_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "deliverable_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "author_person_type_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "private_comment_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "public_comment" (
    "id" UUID NOT NULL,
    "deliverable_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "public_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_comment_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "deliverable_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "public_comment_history_pkey" PRIMARY KEY ("revision_id")
);

-- AddForeignKey
ALTER TABLE "deliverable_action" ADD CONSTRAINT "deliverable_action_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_deliverable_submission_action_id_deliverable_subm_fkey" FOREIGN KEY ("deliverable_submission_action_id", "deliverable_submission_action_type_id") REFERENCES "deliverable_action"("id", "action_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_deliverable_submission_action_type_id_fkey" FOREIGN KEY ("deliverable_submission_action_type_id") REFERENCES "deliverable_submission_action_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_comment" ADD CONSTRAINT "private_comment_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_comment" ADD CONSTRAINT "private_comment_author_user_id_author_person_type_id_fkey" FOREIGN KEY ("author_user_id", "author_person_type_id") REFERENCES "users"("id", "person_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_comment" ADD CONSTRAINT "private_comment_author_person_type_id_fkey" FOREIGN KEY ("author_person_type_id") REFERENCES "cms_user_person_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_comment" ADD CONSTRAINT "public_comment_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_comment" ADD CONSTRAINT "public_comment_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
