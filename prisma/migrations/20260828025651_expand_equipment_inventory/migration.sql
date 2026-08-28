-- CreateEnum
CREATE TYPE "EquipmentOwnership" AS ENUM ('OWNED', 'RENTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EquipmentType" ADD VALUE 'SMARTPHONE';
ALTER TYPE "EquipmentType" ADD VALUE 'TABLET';
ALTER TYPE "EquipmentType" ADD VALUE 'RADIO';
ALTER TYPE "EquipmentType" ADD VALUE 'PRINTER';

-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "ownership" "EquipmentOwnership" NOT NULL DEFAULT 'OWNED',
ADD COLUMN     "warrantyExpiresAt" TIMESTAMP(3);
