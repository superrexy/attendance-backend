/*
  Warnings:

  - You are about to drop the column `latitude` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `attendances` table. All the data in the column will be lost.
  - Added the required column `check_in_latitude` to the `attendances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `check_in_longitude` to the `attendances` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `attendances` DROP COLUMN `latitude`,
    DROP COLUMN `longitude`,
    ADD COLUMN `check_in_latitude` DOUBLE NOT NULL,
    ADD COLUMN `check_in_longitude` DOUBLE NOT NULL,
    ADD COLUMN `check_out_latitude` DOUBLE NULL,
    ADD COLUMN `check_out_longitude` DOUBLE NULL;
