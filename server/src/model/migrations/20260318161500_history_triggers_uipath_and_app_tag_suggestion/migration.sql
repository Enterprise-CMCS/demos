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
