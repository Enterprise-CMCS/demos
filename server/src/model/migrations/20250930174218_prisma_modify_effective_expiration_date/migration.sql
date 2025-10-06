-- AlterTable
ALTER TABLE "demos_app"."demonstration" ALTER COLUMN "effective_date" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "expiration_date" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "demos_app"."demonstration_history" ALTER COLUMN "effective_date" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "expiration_date" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "demos_app"."modification" ALTER COLUMN "effective_date" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "expiration_date" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "demos_app"."modification_history" ALTER COLUMN "effective_date" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "expiration_date" SET DATA TYPE TIMESTAMPTZ;
