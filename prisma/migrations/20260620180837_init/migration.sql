/*
  Warnings:

  - You are about to drop the `Test` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Company" AS ENUM ('ORM', 'GP2');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'IT', 'SECURITY');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('ASSIGNED', 'AVAILABLE', 'STORAGE', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "PermitStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScanResult" AS ENUM ('ALLOWED', 'DENIED');

-- DropTable
DROP TABLE "Test";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "sapNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "department" TEXT,
    "position" TEXT,
    "company" "Company" NOT NULL,
    "photoPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" SERIAL NOT NULL,
    "assetTag" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "inventoryNumber" TEXT,
    "serialNumber" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "company" "Company" NOT NULL,
    "status" "EquipmentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL,
    "returnedAt" TIMESTAMP(3),
    "replacementReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permit" (
    "id" SERIAL NOT NULL,
    "folio" TEXT NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "status" "PermitStatus" NOT NULL,
    "generatedPdfPath" TEXT,
    "signedPdfPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanLog" (
    "id" SERIAL NOT NULL,
    "permitId" INTEGER NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result" "ScanResult" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ScanLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" SERIAL NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "maintenanceDate" TIMESTAMP(3) NOT NULL,
    "provider" TEXT,
    "folio" TEXT,
    "generatedPdfPath" TEXT,
    "signedPdfPath" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_sapNumber_key" ON "Employee"("sapNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_assetTag_key" ON "Equipment"("assetTag");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_barcode_key" ON "Equipment"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_inventoryNumber_key" ON "Equipment"("inventoryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_serialNumber_key" ON "Equipment"("serialNumber");

-- CreateIndex
CREATE INDEX "Assignment_employeeId_idx" ON "Assignment"("employeeId");

-- CreateIndex
CREATE INDEX "Assignment_equipmentId_idx" ON "Assignment"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Permit_folio_key" ON "Permit"("folio");

-- CreateIndex
CREATE INDEX "Permit_employeeId_idx" ON "Permit"("employeeId");

-- CreateIndex
CREATE INDEX "Permit_equipmentId_idx" ON "Permit"("equipmentId");

-- CreateIndex
CREATE INDEX "Permit_status_idx" ON "Permit"("status");

-- CreateIndex
CREATE INDEX "ScanLog_permitId_idx" ON "ScanLog"("permitId");

-- CreateIndex
CREATE INDEX "ScanLog_scannedAt_idx" ON "ScanLog"("scannedAt");

-- CreateIndex
CREATE INDEX "Maintenance_equipmentId_idx" ON "Maintenance"("equipmentId");

-- CreateIndex
CREATE INDEX "Maintenance_maintenanceDate_idx" ON "Maintenance"("maintenanceDate");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permit" ADD CONSTRAINT "Permit_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permit" ADD CONSTRAINT "Permit_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanLog" ADD CONSTRAINT "ScanLog_permitId_fkey" FOREIGN KEY ("permitId") REFERENCES "Permit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
