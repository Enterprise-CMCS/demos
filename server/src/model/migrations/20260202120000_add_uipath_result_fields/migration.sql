-- AlterTable
ALTER TABLE "uipath_result"
ADD COLUMN "project_id" TEXT NOT NULL DEFAULT '',
ADD COLUMN "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

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

    CONSTRAINT "uipath_result_field_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "uipath_result_field_uipath_result_id_idx" ON "uipath_result_field"("uipath_result_id");

-- AddForeignKey
ALTER TABLE "uipath_result_field"
ADD CONSTRAINT "uipath_result_field_uipath_result_id_fkey"
FOREIGN KEY ("uipath_result_id") REFERENCES "uipath_result"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
