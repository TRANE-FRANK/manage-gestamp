-- AlterTable
ALTER TABLE "Permit" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3);
