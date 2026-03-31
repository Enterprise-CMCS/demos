SET search_path TO demos_app;

-- DropForeignKey
ALTER TABLE "uipath_result" DROP CONSTRAINT "uipath_result_document_id_fkey";

-- DropForeignKey
ALTER TABLE "uipath_result_field" DROP CONSTRAINT "uipath_result_field_uipath_result_id_fkey";

-- AlterTable
ALTER TABLE "uipath_result" ADD COLUMN     "application_id" UUID NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL,
ALTER COLUMN "document_id" SET NOT NULL;

-- DropTable
DROP TABLE "uipath_result_field";

-- CreateTable
CREATE TABLE "application_tag_suggestion" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "application_tag_suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_tag_suggestion_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "application_tag_suggestion_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "application_tag_suggestion_extract" (
    "suggestion_id" UUID NOT NULL,
    "uipath_value_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "field_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "start_page_no" INTEGER NOT NULL,
    "end_page_no" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "application_tag_suggestion_extract_pkey" PRIMARY KEY ("suggestion_id","uipath_value_id")
);

-- CreateTable
CREATE TABLE "application_tag_suggestion_extract_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suggestion_id" UUID NOT NULL,
    "uipath_value_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "field_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "start_page_no" INTEGER NOT NULL,
    "end_page_no" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "application_tag_suggestion_extract_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "application_tag_suggestion_extract_field_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "application_tag_suggestion_extract_field_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_tag_suggestion_status" (
    "id" TEXT NOT NULL,

    CONSTRAINT "application_tag_suggestion_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uipath_result_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "request_id" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "project_id" TEXT NOT NULL,
    "document_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "status_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "uipath_result_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "uipath_value" (
    "id" UUID NOT NULL,
    "uipath_result_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "field_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "text_length" INTEGER NOT NULL,
    "text_start_index" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "token_list" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "uipath_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uipath_value_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "uipath_result_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "field_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "text_length" INTEGER NOT NULL,
    "text_start_index" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "token_list" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "uipath_value_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "application_tag_suggestion_id_application_id_value_key"
ON "application_tag_suggestion"("id", "application_id", "value");

-- CreateIndex
CREATE UNIQUE INDEX "uipath_value_id_application_id_field_id_value_key"
ON "uipath_value"("id", "application_id", "field_id", "value");

-- CreateIndex
CREATE UNIQUE INDEX "document_id_application_id_key"
ON "document"("id", "application_id");

-- CreateIndex
CREATE UNIQUE INDEX "uipath_result_id_document_id_application_id_key"
ON "uipath_result"("id", "document_id", "application_id");

-- CreateIndex
CREATE UNIQUE INDEX "uipath_result_document_id_key"
ON "uipath_result"("document_id");

-- AddForeignKey
ALTER TABLE "application_tag_suggestion" ADD CONSTRAINT "application_tag_suggestion_status_id_fkey"
FOREIGN KEY ("status_id") REFERENCES "application_tag_suggestion_status"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_tag_suggestion_extract" ADD CONSTRAINT "application_tag_suggestion_extract_suggestion_id_applicati_fkey"
FOREIGN KEY ("suggestion_id", "application_id", "value") REFERENCES "application_tag_suggestion"("id", "application_id", "value")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_tag_suggestion_extract" ADD CONSTRAINT "application_tag_suggestion_extract_uipath_value_id_applica_fkey"
FOREIGN KEY ("uipath_value_id", "application_id", "field_id", "value") REFERENCES "uipath_value"("id", "application_id", "field_id", "value")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_tag_suggestion_extract" ADD CONSTRAINT "application_tag_suggestion_extract_field_id_fkey"
FOREIGN KEY ("field_id") REFERENCES "application_tag_suggestion_extract_field_limit"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uipath_result" ADD CONSTRAINT "uipath_result_document_id_application_id_fkey"
FOREIGN KEY ("document_id", "application_id") REFERENCES "document"("id", "application_id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uipath_value" ADD CONSTRAINT "uipath_value_uipath_result_id_document_id_application_id_fkey"
FOREIGN KEY ("uipath_result_id", "document_id", "application_id") REFERENCES "uipath_result"("id", "document_id", "application_id")
ON DELETE RESTRICT ON UPDATE CASCADE;
