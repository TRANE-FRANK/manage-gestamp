-- Prevent accidental duplicate preventive-maintenance records per equipment
-- and calendar date. Report conflicting records before the date conversion or
-- unique index is attempted so existing history is never silently discarded.
BEGIN;
LOCK TABLE "Maintenance" IN ACCESS EXCLUSIVE MODE;

DO $$
DECLARE
    duplicate_details TEXT;
BEGIN
    SELECT string_agg(
        format(
            'equipmentId=%s, date=%s, maintenanceIds=%s',
            conflicts."equipmentId",
            conflicts.calendar_date,
            conflicts.maintenance_ids
        ),
        E'\n'
    )
    INTO duplicate_details
    FROM (
        SELECT
            "equipmentId",
            "maintenanceDate"::date AS calendar_date,
            array_agg(id ORDER BY id) AS maintenance_ids
        FROM "Maintenance"
        GROUP BY "equipmentId", "maintenanceDate"::date
        HAVING count(*) > 1
    ) AS conflicts;

    IF duplicate_details IS NOT NULL THEN
        RAISE EXCEPTION
            'Cannot add Maintenance equipment/date uniqueness; resolve these calendar-date duplicates first:%',
            E'\n' || duplicate_details;
    END IF;
END $$;

-- A maintenance effective date is a calendar date; preserve its date while
-- discarding any time component from legacy timestamp values.
ALTER TABLE "Maintenance"
    ALTER COLUMN "maintenanceDate" TYPE DATE
    USING "maintenanceDate"::date;

CREATE TABLE "MaintenanceBatch" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceBatch_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Maintenance"
    ADD COLUMN "batchId" INTEGER;

CREATE INDEX "Maintenance_batchId_idx" ON "Maintenance"("batchId");

CREATE UNIQUE INDEX "Maintenance_equipmentId_maintenanceDate_key"
    ON "Maintenance"("equipmentId", "maintenanceDate");

ALTER TABLE "Maintenance"
    ADD CONSTRAINT "Maintenance_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "MaintenanceBatch"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
