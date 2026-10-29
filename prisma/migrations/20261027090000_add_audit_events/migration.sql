CREATE TYPE "AuditOutcome" AS ENUM ('SUCCESS', 'FAILURE');

CREATE TABLE "AuditEvent" (
    "id" SERIAL NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserIdSnapshot" INTEGER,
    "actorUsernameSnapshot" TEXT,
    "actorRoleSnapshot" "UserRole",
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "outcome" "AuditOutcome" NOT NULL,
    "source" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditEvent_occurredAt_idx"
    ON "AuditEvent"("occurredAt");

CREATE INDEX "AuditEvent_actorUserIdSnapshot_occurredAt_idx"
    ON "AuditEvent"("actorUserIdSnapshot", "occurredAt");

CREATE INDEX "AuditEvent_entityType_entityId_occurredAt_idx"
    ON "AuditEvent"("entityType", "entityId", "occurredAt");

CREATE INDEX "AuditEvent_action_occurredAt_idx"
    ON "AuditEvent"("action", "occurredAt");
