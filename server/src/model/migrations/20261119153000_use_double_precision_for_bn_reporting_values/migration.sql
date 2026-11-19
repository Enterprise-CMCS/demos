BEGIN;

-- AlterTable
ALTER TABLE "budget_neutrality_workbook_hypothetical_value" ALTER COLUMN "value" SET DATA TYPE DOUBLE PRECISION;

-- Restore precision for any snapshots written before the type change.
UPDATE "budget_neutrality_workbook_hypothetical_value" AS reporting
SET "value" = workbook."net_variance_total"
FROM "budget_neutrality_workbook" AS workbook
WHERE reporting."workbook_id" = workbook."id"
    AND reporting."hypothetical_id" = 'Main'
    AND reporting."measure_id" = 'Net Variance'
    AND reporting."meg_name" IS NULL
    AND reporting."dy_number" IS NULL
    AND workbook."net_variance_total" IS NOT NULL
    AND reporting."value" IS DISTINCT FROM workbook."net_variance_total";

COMMIT;