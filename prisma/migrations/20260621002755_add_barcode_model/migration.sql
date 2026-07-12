/*
  Warnings:

  - A unique constraint covering the columns `[barcode]` on the table `Equipment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "barcode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_barcode_key" ON "Equipment"("barcode");
