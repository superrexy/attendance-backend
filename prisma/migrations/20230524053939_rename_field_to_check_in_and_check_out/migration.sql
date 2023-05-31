/*
  Warnings:

  - You are about to drop the column `date` on the `attendances` table. All the data in the column will be lost.
  - Added the required column `check_in` to the `attendances` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `attendances` DROP COLUMN `date`,
    ADD COLUMN `check_in` DATETIME(3) NOT NULL,
    ADD COLUMN `check_out` DATETIME(3) NULL;
