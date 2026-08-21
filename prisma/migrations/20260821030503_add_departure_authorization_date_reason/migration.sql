-- AlterTable
ALTER TABLE "Permit" ADD COLUMN     "departureAuthorizationReason" TEXT,
ADD COLUMN     "departureAuthorizedAt" TIMESTAMP(3);
