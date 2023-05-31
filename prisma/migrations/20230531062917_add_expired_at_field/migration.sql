/*
  Warnings:

  - Added the required column `expires_at` to the `reset_passwords` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `reset_passwords` ADD COLUMN `expires_at` DATETIME(3) NOT NULL;
