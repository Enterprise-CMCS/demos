-- AlterTable
ALTER TABLE "modification" ALTER COLUMN "effective_date" DROP NOT NULL,
ALTER COLUMN "expiration_date" DROP NOT NULL;

-- AlterTable
ALTER TABLE "modification_history" ALTER COLUMN "effective_date" DROP NOT NULL,
ALTER COLUMN "expiration_date" DROP NOT NULL;
