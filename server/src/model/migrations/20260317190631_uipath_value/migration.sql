SET search_path TO demos_app;

DROP TABLE IF EXISTS "uipath_result_field";

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
    "token_list" JSON NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "uipath_value_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "uipath_value_uipath_result_id_document_id_application_id_idx" ON "uipath_value"("uipath_result_id", "document_id", "application_id");

-- CreateIndex
CREATE UNIQUE INDEX "uipath_value_id_application_id_field_id_value_key" ON "uipath_value"("id", "application_id", "field_id", "value");

-- AddForeignKey
ALTER TABLE "uipath_value" ADD CONSTRAINT "uipath_value_uipath_result_id_fkey" FOREIGN KEY ("uipath_result_id") REFERENCES "uipath_result"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uipath_value" ADD CONSTRAINT "uipath_value_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uipath_value" ADD CONSTRAINT "uipath_value_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
