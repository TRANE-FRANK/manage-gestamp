DROP INDEX IF EXISTS "Assignment_equipmentId_active_unique";

CREATE UNIQUE INDEX "Assignment_equipmentId_active_unique"
ON "Assignment" ("equipmentId")
WHERE "returnedAt" IS NULL AND "cancelledAt" IS NULL;
