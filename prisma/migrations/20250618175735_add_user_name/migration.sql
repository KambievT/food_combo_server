/*
  Warnings:

  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "name" TEXT;

-- Update existing records
UPDATE "User" SET "name" = 'Default User' WHERE "name" IS NULL;

-- Make the column required
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;
