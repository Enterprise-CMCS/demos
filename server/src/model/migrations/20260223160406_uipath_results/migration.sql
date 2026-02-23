-- CreateTable
CREATE TABLE "uipath_result" (
    "id" UUID NOT NULL,
    "request_id" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "project_id" TEXT NOT NULL,
    "document_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uipath_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uipath_result_field" (
    "id" UUID NOT NULL,
    "uipath_result_id" UUID NOT NULL,
    "field_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "field_type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "value_json" JSONB NOT NULL,
    "text_length" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uipath_result_field_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "uipath_result_document_id_idx" ON "uipath_result"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "uipath_result_request_id_key" ON "uipath_result"("request_id");

-- CreateIndex
CREATE INDEX "uipath_result_field_uipath_result_id_idx" ON "uipath_result_field"("uipath_result_id");

-- CreateIndex
CREATE UNIQUE INDEX "uipath_result_field_uipath_result_id_field_id_key" ON "uipath_result_field"("uipath_result_id", "field_id");

-- AddForeignKey
ALTER TABLE "uipath_result" ADD CONSTRAINT "uipath_result_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uipath_result_field" ADD CONSTRAINT "uipath_result_field_uipath_result_id_fkey" FOREIGN KEY ("uipath_result_id") REFERENCES "uipath_result"("id") ON DELETE CASCADE ON UPDATE CASCADE;
