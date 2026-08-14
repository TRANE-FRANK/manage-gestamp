-- CreateEnum
CREATE TYPE "ScanReason" AS ENUM (
    'ALLOWED',
    'INVALID_ASSET_TAG',
    'EQUIPMENT_NOT_FOUND',
    'NO_PERMIT',
    'CANCELLED',
    'EXPIRED',
    'NOT_STARTED',
    'NOT_ACTIVE'
);

-- AddColumn temporalmente como nullable
ALTER TABLE "ScanLog"
ADD COLUMN "reason" "ScanReason";

-- Recuperar el motivo de los registros existentes
UPDATE "ScanLog"
SET "reason" =
    CASE
        WHEN "result" = 'ALLOWED'
            THEN 'ALLOWED'::"ScanReason"

        WHEN "notes" = 'El permiso está cancelado.'
            THEN 'CANCELLED'::"ScanReason"

        WHEN "notes" = 'El permiso está expirado.'
            THEN 'EXPIRED'::"ScanReason"

        WHEN "notes" = 'El permiso ha expirado.'
            THEN 'EXPIRED'::"ScanReason"

        WHEN "notes" = 'El equipo no tiene ningún permiso registrado.'
            THEN 'NO_PERMIT'::"ScanReason"

        WHEN "notes" = 'El permiso todavía no está vigente.'
            THEN 'NOT_STARTED'::"ScanReason"

        WHEN "notes" = 'El permiso no está activo.'
            THEN 'NOT_ACTIVE'::"ScanReason"

        WHEN "notes" = 'El equipo no está registrado.'
            THEN 'EQUIPMENT_NOT_FOUND'::"ScanReason"

        WHEN "notes" = 'Debes proporcionar el Asset Tag del equipo.'
            THEN 'INVALID_ASSET_TAG'::"ScanReason"

        ELSE 'ALLOWED'::"ScanReason"
    END
WHERE "reason" IS NULL;

-- Convertir la columna en obligatoria
ALTER TABLE "ScanLog"
ALTER COLUMN "reason" SET NOT NULL;

-- CreateIndex
CREATE INDEX "ScanLog_result_idx" ON "ScanLog"("result");

-- CreateIndex
CREATE INDEX "ScanLog_reason_idx" ON "ScanLog"("reason");