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

    CONSTRAINT "application_tag_suggestion_extract_pkey" PRIMARY KEY ("suggestion_id", "uipath_value_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "application_tag_suggestion_id_application_id_value_key" ON "application_tag_suggestion"("id", "application_id", "value");

-- CreateIndex
CREATE UNIQUE INDEX "uipath_value_id_application_id_value_key" ON "uipath_value"("id", "application_id", "value");

-- AddForeignKey
ALTER TABLE "application_tag_suggestion" ADD CONSTRAINT "application_tag_suggestion_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "application_tag_suggestion_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_tag_suggestion_extract" ADD CONSTRAINT "application_tag_suggestion_extract_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "application_tag_suggestion_extract_field_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_tag_suggestion_extract" ADD CONSTRAINT "application_tag_suggestion_extract_uipath_value_id_application_id_value_fkey" FOREIGN KEY ("uipath_value_id", "application_id", "value") REFERENCES "uipath_value"("id", "application_id", "value") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_tag_suggestion_extract" ADD CONSTRAINT "application_tag_suggestion_extract_suggestion_id_application_id_value_fkey" FOREIGN KEY ("suggestion_id", "application_id", "value") REFERENCES "application_tag_suggestion"("id", "application_id", "value") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
