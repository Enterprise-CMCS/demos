SET search_path TO demos_app;

-- AlterTable
ALTER TABLE "budget_neutrality_workbook" ADD COLUMN     "actuals" TEXT,
ADD COLUMN     "net_variance_total" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "budget_neutrality_workbook_history" ADD COLUMN     "actuals" TEXT,
ADD COLUMN     "net_variance_total" DOUBLE PRECISION;


ALTER TABLE
    demos_app.budget_neutrality_workbook
ADD CONSTRAINT
    check_budget_neutrality_workbook_non_null_fields_when_succeeded
CHECK (
    NOT (
        validation_status_id = 'Succeeded'
        AND (
            actuals IS NULL
            OR net_variance_total IS NULL           
        )
    )
);
