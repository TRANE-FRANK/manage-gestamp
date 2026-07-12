/*
  Warnings:

  - You are about to drop the column `barcode` on the `Equipment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('LAPTOP', 'DESKTOP');

-- DropIndex
DROP INDEX "Equipment_barcode_key";

-- AlterTable
ALTER TABLE "Equipment" DROP COLUMN "barcode",
ADD COLUMN     "type" "EquipmentType";
