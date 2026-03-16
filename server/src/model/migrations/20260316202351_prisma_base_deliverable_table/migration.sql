/*
  Warnings:

  - A unique constraint covering the columns `[id,status_id]` on the table `demonstration` will be added. If there are existing duplicate values, this will fail.

*/

SET search_path TO demos_app;

-- CreateTable
CREATE TABLE "cms_user_person_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "cms_user_person_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable" (
    "id" UUID NOT NULL,
    "deliverable_type_id" TEXT NOT NULL,
    "demonstration_id" TEXT NOT NULL,
    "demonstration_status_id" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "cms_owner_user_id" TEXT NOT NULL,
    "cms_owner_person_type_id" TEXT NOT NULL,
    "due_date" TIMESTAMPTZ NOT NULL,
    "due_date_type_id" TEXT NOT NULL,
    "expected_to_be_submitted" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "deliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "deliverable_type_id" TEXT NOT NULL,
    "demonstration_id" TEXT NOT NULL,
    "demonstration_status_id" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "cms_owner_user_id" TEXT NOT NULL,
    "cms_owner_person_type_id" TEXT NOT NULL,
    "due_date" TIMESTAMPTZ NOT NULL,
    "due_date_type_id" TEXT NOT NULL,
    "expected_to_be_submitted" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "deliverable_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "deliverable_demonstration_status_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "deliverable_demonstration_status_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_due_date_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "deliverable_due_date_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_status" (
    "id" TEXT NOT NULL,

    CONSTRAINT "deliverable_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "deliverable_type_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deliverable_id_demonstration_id_deliverable_type_id_key" ON "deliverable"("id", "demonstration_id", "deliverable_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "demonstration_id_status_id_key" ON "demonstration"("id", "status_id");

-- AddForeignKey
ALTER TABLE "cms_user_person_type_limit" ADD CONSTRAINT "cms_user_person_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "person_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable" ADD CONSTRAINT "deliverable_deliverable_type_id_fkey" FOREIGN KEY ("deliverable_type_id") REFERENCES "deliverable_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable" ADD CONSTRAINT "deliverable_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "deliverable_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable" ADD CONSTRAINT "deliverable_demonstration_id_demonstration_status_id_fkey" FOREIGN KEY ("demonstration_id", "demonstration_status_id") REFERENCES "demonstration"("id", "status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable" ADD CONSTRAINT "deliverable_demonstration_status_id_fkey" FOREIGN KEY ("demonstration_status_id") REFERENCES "deliverable_demonstration_status_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable" ADD CONSTRAINT "deliverable_cms_owner_user_id_cms_owner_person_type_id_fkey" FOREIGN KEY ("cms_owner_user_id", "cms_owner_person_type_id") REFERENCES "users"("id", "person_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable" ADD CONSTRAINT "deliverable_cms_owner_person_type_id_fkey" FOREIGN KEY ("cms_owner_person_type_id") REFERENCES "cms_user_person_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable" ADD CONSTRAINT "deliverable_due_date_type_id_fkey" FOREIGN KEY ("due_date_type_id") REFERENCES "deliverable_due_date_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_demonstration_status_limit" ADD CONSTRAINT "deliverable_demonstration_status_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "application_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
