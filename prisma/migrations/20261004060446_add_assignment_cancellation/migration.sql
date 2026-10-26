-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3);
