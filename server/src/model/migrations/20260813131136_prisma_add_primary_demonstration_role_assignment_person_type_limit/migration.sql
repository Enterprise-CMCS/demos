
-- DropForeignKey
ALTER TABLE "primary_demonstration_role_assignment" DROP CONSTRAINT "primary_demonstration_role_assignment_person_id_demonstrat_fkey";

-- DropIndex
DROP INDEX "primary_demonstration_role_assignment_person_id_demonstrati_key";

-- AlterTable
ALTER TABLE "primary_demonstration_role_assignment" ADD COLUMN     "person_type_id" TEXT;

UPDATE "primary_demonstration_role_assignment" 
SET "person_type_id" = "demonstration_role_assignment"."person_type_id" 
FROM "demonstration_role_assignment" 
WHERE 
  "primary_demonstration_role_assignment"."person_id" = "demonstration_role_assignment"."person_id" 
  AND "primary_demonstration_role_assignment"."demonstration_id" = "demonstration_role_assignment"."demonstration_id" 
  AND "primary_demonstration_role_assignment"."role_id" = "demonstration_role_assignment"."role_id"
;

ALTER TABLE "primary_demonstration_role_assignment" ALTER COLUMN "person_type_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "primary_demonstration_role_assignment_history" ADD COLUMN     "person_type_id" TEXT;

-- CreateTable
CREATE TABLE "primary_demonstration_role_assignment_person_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "primary_demonstration_role_assignment_person_type_limit_pkey" PRIMARY KEY ("id")
);

INSERT INTO "primary_demonstration_role_assignment_person_type_limit" ("id") VALUES 
  ('demos-admin'),
  ('demos-cms-user'),
  ('demos-state-user')
;

-- CreateIndex
CREATE UNIQUE INDEX "demonstration_role_assignment_person_id_demonstration_id_ro_key" ON "demonstration_role_assignment"("person_id", "demonstration_id", "role_id", "person_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "primary_demonstration_role_assignment_person_id_demonstrati_key" ON "primary_demonstration_role_assignment"("person_id", "demonstration_id", "role_id", "person_type_id");

-- AddForeignKey
ALTER TABLE "primary_demonstration_role_assignment" ADD CONSTRAINT "primary_demonstration_role_assignment_person_id_demonstrat_fkey" FOREIGN KEY ("person_id", "demonstration_id", "role_id", "person_type_id") REFERENCES "demonstration_role_assignment"("person_id", "demonstration_id", "role_id", "person_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primary_demonstration_role_assignment" ADD CONSTRAINT "primary_demonstration_role_assignment_person_type_id_fkey" FOREIGN KEY ("person_type_id") REFERENCES "primary_demonstration_role_assignment_person_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primary_demonstration_role_assignment_person_type_limit" ADD CONSTRAINT "primary_demonstration_role_assignment_person_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "person_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
