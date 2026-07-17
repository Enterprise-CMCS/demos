SET search_path TO demos_app;

-- AlterTable
ALTER TABLE "reference" ADD COLUMN     "description" TEXT NOT NULL DEFAULT 'Description';

-- AlterTable
ALTER TABLE "reference_history" ADD COLUMN     "description" TEXT NOT NULL DEFAULT 'Description';

-- Drop defaults
ALTER TABLE "reference" ALTER COLUMN "description" DROP DEFAULT;
ALTER TABLE "reference_history" ALTER COLUMN "description" DROP DEFAULT;

ALTER TABLE
    demos_app.reference
ADD CONSTRAINT
    check_non_empty_description
CHECK (
    trim(description) != ''
);
