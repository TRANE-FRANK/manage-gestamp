CREATE UNIQUE INDEX "Assignment_equipmentId_active_unique"
ON "Assignment" ("equipmentId")
WHERE "returnedAt" IS NULL;