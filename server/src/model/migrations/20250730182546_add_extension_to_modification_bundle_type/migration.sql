/*
 Warnings:
 
 - You are about to drop the column `created_at` on the `bundle_type` table. All the data in the column will be lost.
 - You are about to drop the column `updated_at` on the `bundle_type` table. All the data in the column will be lost.
 - You are about to drop the `extension` table. If the table is not empty, all the data it contains will be lost.
 - You are about to drop the `extension_bundle_type` table. If the table is not empty, all the data it contains will be lost.
 - You are about to drop the `extension_history` table. If the table is not empty, all the data it contains will be lost.
 - You are about to drop the `extension_status` table. If the table is not empty, all the data it contains will be lost.
 - You are about to drop the `extension_status_history` table. If the table is not empty, all the data it contains will be lost.
 
 */
-- DropForeignKey
ALTER TABLE "extension" DROP CONSTRAINT "extension_bundle_type_id_fkey";
-- DropForeignKey
ALTER TABLE "extension" DROP CONSTRAINT "extension_demonstration_id_fkey";
-- DropForeignKey
ALTER TABLE "extension" DROP CONSTRAINT "extension_extension_status_id_bundle_type_id_fkey";
-- DropForeignKey
ALTER TABLE "extension" DROP CONSTRAINT "extension_id_bundle_type_id_fkey";
-- DropForeignKey
ALTER TABLE "extension" DROP CONSTRAINT "extension_project_officer_user_id_fkey";
-- DropForeignKey
ALTER TABLE "extension_bundle_type" DROP CONSTRAINT "extension_bundle_type_id_fkey";
-- DropForeignKey
ALTER TABLE "extension_status" DROP CONSTRAINT "extension_status_bundle_type_id_fkey";
-- AlterTable
ALTER TABLE "bundle_type" DROP COLUMN "created_at",
  DROP COLUMN "updated_at";
-- DropTable
DROP TABLE "extension";
-- DropTable
DROP TABLE "extension_bundle_type";
-- DropTable
DROP TABLE "extension_history";
-- DropTable
DROP TABLE "extension_status";
-- DropTable
DROP TABLE "extension_status_history";
-- Add EXTENSION to modification_bundle_type so extensions can use the modification model
INSERT INTO modification_bundle_type (id)
VALUES ('EXTENSION');
