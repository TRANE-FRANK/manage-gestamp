import { beforeEach, describe, expect, it, vi } from "vitest";

const createMock = vi.fn();

vi.mock("server-only", () => ({}));

import {
  buildAuditEventData,
  writeAuditEvent,
  type WriteAuditEventInput,
} from "@/services/audit/service";

const baseInput: WriteAuditEventInput = {
  actor: { id: 17, username: "it.operator", role: "IT" },
  action: "EQUIPMENT_UPDATED",
  entityType: "EQUIPMENT",
  entityId: "42",
  outcome: "SUCCESS",
  source: "equipment.update",
  before: { status: "AVAILABLE" },
  after: { status: "ASSIGNED" },
};

describe("servicio de escritura de auditoría", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("construye un evento validado con snapshots", () => {
    expect(buildAuditEventData(baseInput)).toEqual({
      actorUserIdSnapshot: 17,
      actorUsernameSnapshot: "it.operator",
      actorRoleSnapshot: "IT",
      action: "EQUIPMENT_UPDATED",
      entityType: "EQUIPMENT",
      entityId: "42",
      outcome: "SUCCESS",
      source: "equipment.update",
      before: { status: "AVAILABLE" },
      after: { status: "ASSIGNED" },
      reason: null,
    });
  });

  it("rechaza campos sensibles y objetos completos de Prisma", () => {
    expect(() =>
      buildAuditEventData({
        ...baseInput,
        before: { passwordHash: "secret" } as never,
      }),
    ).toThrow("no está permitido");
    expect(() =>
      buildAuditEventData({
        ...baseInput,
        after: { equipment: { id: 42 } } as never,
      }),
    ).toThrow("no está permitido");
  });

  it("permite eventos sin actor autenticado", () => {
    const data = buildAuditEventData({ ...baseInput, actor: null });
    expect(data.actorUserIdSnapshot).toBeNull();
    expect(data.actorUsernameSnapshot).toBeNull();
    expect(data.actorRoleSnapshot).toBeNull();
  });

  it("admite vínculos de renovación explícitos entre permisos", () => {
    const data = buildAuditEventData({
      ...baseInput,
      action: "PERMIT_RENEWED",
      entityType: "PERMIT",
      before: { status: "ACTIVE", departureAuthorized: false },
      after: { status: "EXPIRED", replacementPermitId: 52 },
    });

    expect(data.after).toEqual({
      status: "EXPIRED",
      replacementPermitId: 52,
    });
    expect(
      buildAuditEventData({
        ...baseInput,
        action: "PERMIT_CREATED",
        entityType: "PERMIT",
        after: { status: "ACTIVE", renewedFromPermitId: 41 },
      }).after,
    ).toEqual({ status: "ACTIVE", renewedFromPermitId: 41 });
  });

  it("escribe usando el cliente transaccional recibido", async () => {
    const transactionClient = { auditEvent: { create: createMock } };
    createMock.mockResolvedValue({ id: 1 });

    const result = await writeAuditEvent(
      transactionClient as never,
      baseInput,
    );

    expect(result).toEqual({ id: 1 });
    expect(createMock).toHaveBeenCalledWith({
      data: buildAuditEventData(baseInput),
    });
  });
});
