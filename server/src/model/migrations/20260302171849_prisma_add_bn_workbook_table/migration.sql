/*
  Warnings:

  - A unique constraint covering the columns `[id,document_type_id]` on the table `document` will be added. If there are existing duplicate values, this will fail.

*/

SET search_path TO demos_app;

-- CreateTable
CREATE TABLE "budget_neutrality_workbook" (
    "id" UUID NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "validation_status_id" TEXT NOT NULL,
    "validation_data" JSON NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "budget_neutrality_workbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_neutrality_workbook_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "validation_status_id" TEXT NOT NULL,
    "validation_data" JSON NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "budget_neutrality_workbook_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "budget_neutrality_workbook_document_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "budget_neutrality_workbook_document_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_id_document_type_id_key" ON "document"("id", "document_type_id");

-- AddForeignKey
ALTER TABLE "budget_neutrality_workbook" ADD CONSTRAINT "budget_neutrality_workbook_id_document_type_id_fkey" FOREIGN KEY ("id", "document_type_id") REFERENCES "document"("id", "document_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_neutrality_workbook" ADD CONSTRAINT "budget_neutrality_workbook_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "budget_neutrality_workbook_document_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_neutrality_workbook_document_type_limit" ADD CONSTRAINT "budget_neutrality_workbook_document_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "document_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
