/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `reset_passwords` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `reset_passwords_token_key` ON `reset_passwords`;

-- CreateIndex
CREATE UNIQUE INDEX `reset_passwords_user_id_key` ON `reset_passwords`(`user_id`);
