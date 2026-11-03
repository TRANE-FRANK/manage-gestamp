-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "departmentId" INTEGER;

-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "locationId" INTEGER,
ADD COLUMN     "responsibleDepartmentId" INTEGER;

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "company" "Company" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "company" "Company" NOT NULL DEFAULT 'GP2',
    "parentId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Department_company_isActive_idx" ON "Department"("company", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Department_id_company_key" ON "Department"("id", "company");

-- CreateIndex
CREATE UNIQUE INDEX "Department_company_name_key" ON "Department"("company", "name");

-- CreateIndex
CREATE INDEX "Location_company_parentId_idx" ON "Location"("company", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_id_company_key" ON "Location"("id", "company");

-- CreateIndex
CREATE UNIQUE INDEX "Location_company_parentId_name_key" ON "Location"("company", "parentId", "name");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_company_fkey" FOREIGN KEY ("departmentId", "company") REFERENCES "Department"("id", "company") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_responsibleDepartmentId_company_fkey" FOREIGN KEY ("responsibleDepartmentId", "company") REFERENCES "Department"("id", "company") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_locationId_company_fkey" FOREIGN KEY ("locationId", "company") REFERENCES "Location"("id", "company") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_company_fkey" FOREIGN KEY ("parentId", "company") REFERENCES "Location"("id", "company") ON DELETE RESTRICT ON UPDATE CASCADE;
