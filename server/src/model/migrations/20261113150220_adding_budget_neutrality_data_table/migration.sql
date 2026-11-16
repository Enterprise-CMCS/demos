-- CreateTable
CREATE TABLE "budget_neutrality_workbook_data" (
    "budget_neutrality_workbook_id" UUID NOT NULL,
    "parsed_data" JSONB NOT NULL,

    CONSTRAINT "budget_neutrality_workbook_data_pkey" PRIMARY KEY ("budget_neutrality_workbook_id")
);

-- AddForeignKey
ALTER TABLE "budget_neutrality_workbook_data" ADD CONSTRAINT "budget_neutrality_workbook_data_budget_neutrality_workbook_fkey" FOREIGN KEY ("budget_neutrality_workbook_id") REFERENCES "budget_neutrality_workbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
