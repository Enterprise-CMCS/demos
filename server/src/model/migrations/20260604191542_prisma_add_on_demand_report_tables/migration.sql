SET search_path TO demos_app;

-- CreateTable
CREATE TABLE "on_demand_report" (
    "id" UUID NOT NULL,
    "s3_path" TEXT NOT NULL,
    "requesting_user_id" UUID NOT NULL,
    "report_type_id" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "report_generated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "on_demand_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "on_demand_report_status" (
    "id" TEXT NOT NULL,

    CONSTRAINT "on_demand_report_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "on_demand_report_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "on_demand_report_type_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "on_demand_report" ADD CONSTRAINT "on_demand_report_requesting_user_id_fkey" FOREIGN KEY ("requesting_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "on_demand_report" ADD CONSTRAINT "on_demand_report_report_type_id_fkey" FOREIGN KEY ("report_type_id") REFERENCES "on_demand_report_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "on_demand_report" ADD CONSTRAINT "on_demand_report_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "on_demand_report_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
