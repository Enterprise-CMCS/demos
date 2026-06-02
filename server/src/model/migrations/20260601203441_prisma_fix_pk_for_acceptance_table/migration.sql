/*
  Warnings:

  - The primary key for the `reference_agreement_acceptance` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/

SET search_path TO demos_app;

-- AlterTable
ALTER TABLE "reference_agreement_acceptance" DROP CONSTRAINT "reference_agreement_acceptance_pkey",
ADD CONSTRAINT "reference_agreement_acceptance_pkey" PRIMARY KEY ("reference_id", "reference_agreement_id", "user_id", "acceptance_timestamp");
