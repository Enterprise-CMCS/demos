
-- DropForeignKey
ALTER TABLE "deliverable" DROP CONSTRAINT "deliverable_cms_owner_person_type_id_fkey";

-- DropForeignKey
ALTER TABLE "private_comment" DROP CONSTRAINT "private_comment_author_person_type_id_fkey";

-- CreateTable
CREATE TABLE "deliverable_owner_person_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "deliverable_owner_person_type_limit_pkey" PRIMARY KEY ("id")
);

INSERT INTO "deliverable_owner_person_type_limit" ("id") VALUES
    ('demos-admin'),
    ('demos-cms-user'),
    ('demos-cms-reviewer-user')
;

-- AddForeignKey
ALTER TABLE "deliverable" ADD CONSTRAINT "deliverable_cms_owner_person_type_id_fkey" FOREIGN KEY ("cms_owner_person_type_id") REFERENCES "deliverable_owner_person_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_owner_person_type_limit" ADD CONSTRAINT "deliverable_owner_person_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "person_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_comment" ADD CONSTRAINT "private_comment_author_person_type_id_fkey" FOREIGN KEY ("author_person_type_id") REFERENCES "deliverable_owner_person_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
