-- DropForeignKey
ALTER TABLE "ScanLog" DROP CONSTRAINT "ScanLog_permitId_fkey";

-- AlterTable
ALTER TABLE "ScanLog" ADD COLUMN     "assetTag" TEXT,
ALTER COLUMN "permitId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ScanLog" ADD CONSTRAINT "ScanLog_permitId_fkey" FOREIGN KEY ("permitId") REFERENCES "Permit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
