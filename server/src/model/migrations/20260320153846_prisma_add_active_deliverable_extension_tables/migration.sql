SET search_path TO demos_app;

-- CreateTable
CREATE TABLE "deliverable_active_extension" (
    "deliverable_extension_id" UUID NOT NULL,
    "deliverable_id" UUID NOT NULL,
    "status_id" TEXT NOT NULL,

    CONSTRAINT "deliverable_active_extension_pkey" PRIMARY KEY ("deliverable_extension_id")
);

-- CreateTable
CREATE TABLE "deliverable_active_extension_status_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "deliverable_active_extension_status_limit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deliverable_active_extension_deliverable_id_key" ON "deliverable_active_extension"("deliverable_id");

-- AddForeignKey
ALTER TABLE "deliverable_active_extension" ADD CONSTRAINT "deliverable_active_extension_deliverable_extension_id_fkey" FOREIGN KEY ("deliverable_extension_id") REFERENCES "deliverable_extension"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "deliverable_active_extension" ADD CONSTRAINT "deliverable_active_extension_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "deliverable_active_extension_status_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_active_extension_status_limit" ADD CONSTRAINT "deliverable_active_extension_status_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "deliverable_extension_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
