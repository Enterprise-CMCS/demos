/*
  Warnings:

  - A unique constraint covering the columns `[id,demonstration_id]` on the table `deliverable` will be added. If there are existing duplicate values, this will fail.

*/

SET search_path TO demos_app;

-- CreateTable
CREATE TABLE "deliverable_demonstration_type" (
    "deliverable_id" UUID NOT NULL,
    "demonstration_id" UUID NOT NULL,
    "demonstration_type_tag_name_id" TEXT NOT NULL,

    CONSTRAINT "deliverable_demonstration_type_pkey" PRIMARY KEY ("deliverable_id","demonstration_id","demonstration_type_tag_name_id")
);

-- CreateTable
CREATE TABLE "deliverable_demonstration_type_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliverable_id" UUID NOT NULL,
    "demonstration_id" UUID NOT NULL,
    "demonstration_type_tag_name_id" TEXT NOT NULL,

    CONSTRAINT "deliverable_demonstration_type_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deliverable_id_demonstration_id_key" ON "deliverable"("id", "demonstration_id");

-- AddForeignKey
ALTER TABLE "deliverable_demonstration_type" ADD CONSTRAINT "deliverable_demonstration_type_deliverable_id_demonstratio_fkey" FOREIGN KEY ("deliverable_id", "demonstration_id") REFERENCES "deliverable"("id", "demonstration_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_demonstration_type" ADD CONSTRAINT "deliverable_demonstration_type_demonstration_id_demonstrat_fkey" FOREIGN KEY ("demonstration_id", "demonstration_type_tag_name_id") REFERENCES "demonstration_type_tag_assignment"("demonstration_id", "tag_name_id") ON DELETE RESTRICT ON UPDATE CASCADE;
