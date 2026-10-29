import "server-only";

import type { Prisma, UserRole } from "@/generated/prisma/client";
import type { VerifiedUser } from "@/lib/auth/authorization";

const allowedSnapshotFields = new Set([
  "username",
  "firstName",
  "lastName",
  "role",
  "isActive",
  "sapNumber",
  "department",
  "position",
  "company",
  "assetTag",
  "barcode",
  "type",
  "inventoryNumber",
  "serialNumber",
  "brand",
  "model",
  "status",
  "ownership",
  "warrantyExpiresAt",
  "employeeId",
  "equipmentId",
  "equipmentStatus",
  "assignedAt",
  "returnedAt",
  "cancelledAt",
  "folio",
  "replacementPermitId",
  "renewedFromPermitId",
  "startDate",
  "expirationDate",
  "departureAuthorized",
  "departureAuthorizedAt",
  "maintenanceDate",
  "batchId",
  "provider",
  "permitId",
  "scannedAt",
  "result",
  "scanReason",
]);

const validRoles = new Set<UserRole>(["ADMIN", "IT", "SECURITY"]);
const validOutcomes = new Set<AuditOutcome>(["SUCCESS", "FAILURE"]);

export type AuditOutcome = "SUCCESS" | "FAILURE";
export type AuditSnapshotValue = string | number | boolean | null;
export type AuditSnapshot = Record<string, AuditSnapshotValue>;

/** Identity returned by requireUser()/requireRole; never source it from a request. */
export type AuditActor = Pick<VerifiedUser, "id" | "username" | "role">;

export type WriteAuditEventInput = {
  actor?: AuditActor | null;
  action: string;
  entityType: string;
  entityId: string;
  outcome: AuditOutcome;
  /** Internal operation identifier, not a client or device identity. */
  source: string;
  before?: AuditSnapshot;
  after?: AuditSnapshot;
  /** Safe business explanation only; never pass credentials or document content. */
  reason?: string | null;
};

function requireText(
  value: unknown,
  field: string,
  maxLength: number,
  pattern?: RegExp,
): string {
  if (typeof value !== "string") {
    throw new TypeError(`El campo ${field} debe ser texto.`);
  }

  const normalized = value.trim();
  if (
    !normalized ||
    normalized.length > maxLength ||
    (pattern !== undefined && !pattern.test(normalized))
  ) {
    throw new TypeError(`El campo ${field} no es válido.`);
  }

  return normalized;
}

function buildSnapshot(
  value: AuditSnapshot | undefined,
  field: "before" | "after",
): Prisma.InputJsonObject | undefined {
  if (value === undefined) return undefined;
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  ) {
    throw new TypeError(`El campo ${field} debe ser un objeto plano.`);
  }

  const entries = Object.entries(value);
  if (entries.length > 30) {
    throw new TypeError(`El campo ${field} contiene demasiados valores.`);
  }

  const snapshot: Record<string, string | number | boolean | null> = {};
  for (const [key, item] of entries) {
    if (!allowedSnapshotFields.has(key)) {
      throw new TypeError(`El campo ${field}.${key} no está permitido.`);
    }
    if (
      item !== null &&
      typeof item !== "string" &&
      typeof item !== "number" &&
      typeof item !== "boolean"
    ) {
      throw new TypeError(`El valor ${field}.${key} debe ser escalar.`);
    }
    if (typeof item === "number" && !Number.isFinite(item)) {
      throw new TypeError(`El valor ${field}.${key} no es válido.`);
    }
    if (typeof item === "string" && item.length > 1000) {
      throw new TypeError(`El valor ${field}.${key} es demasiado largo.`);
    }
    snapshot[key] = item;
  }

  return snapshot as Prisma.InputJsonObject;
}

export function buildAuditEventData(input: WriteAuditEventInput) {
  if (!input || typeof input !== "object") {
    throw new TypeError("Los datos del evento de auditoría no son válidos.");
  }

  const action = requireText(input.action, "action", 80, /^[A-Z][A-Z0-9_]*$/);
  const entityType = requireText(
    input.entityType,
    "entityType",
    50,
    /^[A-Z][A-Z0-9_]*$/,
  );
  const entityId = requireText(input.entityId, "entityId", 128);
  const source = requireText(
    input.source,
    "source",
    100,
    /^[a-z][a-z0-9._:-]*$/,
  );

  if (!validOutcomes.has(input.outcome)) {
    throw new TypeError("El resultado del evento de auditoría no es válido.");
  }

  let actorData: {
    actorUserIdSnapshot: number | null;
    actorUsernameSnapshot: string | null;
    actorRoleSnapshot: UserRole | null;
  } = {
    actorUserIdSnapshot: null,
    actorUsernameSnapshot: null,
    actorRoleSnapshot: null,
  };

  if (input.actor != null) {
    if (
      !Number.isSafeInteger(input.actor.id) ||
      input.actor.id <= 0 ||
      typeof input.actor.username !== "string" ||
      !input.actor.username.trim() ||
      input.actor.username.trim().length > 100 ||
      !validRoles.has(input.actor.role)
    ) {
      throw new TypeError("La identidad de auditoría del actor no es válida.");
    }
    actorData = {
      actorUserIdSnapshot: input.actor.id,
      actorUsernameSnapshot: input.actor.username.trim(),
      actorRoleSnapshot: input.actor.role,
    };
  }

  let reason: string | null = null;
  if (input.reason != null) {
    reason = requireText(input.reason, "reason", 500);
  }

  return {
    ...actorData,
    action,
    entityType,
    entityId,
    outcome: input.outcome,
    source,
    before: buildSnapshot(input.before, "before"),
    after: buildSnapshot(input.after, "after"),
    reason,
  };
}

/** Writes only. Pass the transaction client that owns the business change. */
export async function writeAuditEvent(
  tx: Prisma.TransactionClient,
  input: WriteAuditEventInput,
) {
  const data = buildAuditEventData(input);
  return tx.auditEvent.create({ data });
}
