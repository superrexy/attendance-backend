-- AlterTable
ALTER TABLE `attendances` MODIFY `check_in` DATETIME(3) NULL,
    MODIFY `check_in_latitude` DOUBLE NULL,
    MODIFY `check_in_longitude` DOUBLE NULL;
