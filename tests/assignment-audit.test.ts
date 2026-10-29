import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireRoleMock,
  findActiveAssignmentByEquipmentMock,
  findAssignmentByIdOrThrowMock,
  assignmentCreateMock,
  assignmentUpdateManyMock,
  equipmentUpdateManyMock,
  equipmentFindUniqueOrThrowMock,
  equipmentUpdateMock,
  writeAuditEventMock,
  transactionMock,
} = vi.hoisted(() => ({
  requireRoleMock: vi.fn(),
  findActiveAssignmentByEquipmentMock: vi.fn(),
  findAssignmentByIdOrThrowMock: vi.fn(),
  assignmentCreateMock: vi.fn(),
  assignmentUpdateManyMock: vi.fn(),
  equipmentUpdateManyMock: vi.fn(),
  equipmentFindUniqueOrThrowMock: vi.fn(),
  equipmentUpdateMock: vi.fn(),
  writeAuditEventMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", () => ({ requireRole: requireRoleMock }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: transactionMock } }));
vi.mock("@/services/assignment/repository", () => ({
  findActiveAssignmentByEquipment: findActiveAssignmentByEquipmentMock,
  findAssignmentByIdOrThrow: findAssignmentByIdOrThrowMock,
}));
vi.mock("@/services/audit/service", () => ({ writeAuditEvent: writeAuditEventMock }));
vi.mock("@/generated/prisma/client", () => ({
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {},
  },
}));

import { createAssignment } from "@/services/assignment/create";
import { returnAssignment } from "@/services/assignment/return";
import { cancelAssignment } from "@/services/assignment/cancel";

const actor = { id: 24, username: "it.operator", role: "IT" as const };
const assignedAt = new Date("2026-10-01T10:00:00.000Z");
const returnedAt = new Date("2026-10-20T10:00:00.000Z");
const cancelledAt = new Date("2026-10-21T10:00:00.000Z");
const activeAssignment = {
  id: 80,
  employeeId: 15,
  equipmentId: 26,
  assignedAt,
  returnedAt: null,
  cancelledAt: null,
};

const tx = {
  assignment: {
    create: assignmentCreateMock,
    updateMany: assignmentUpdateManyMock,
  },
  equipment: {
    updateMany: equipmentUpdateManyMock,
    findUniqueOrThrow: equipmentFindUniqueOrThrowMock,
    update: equipmentUpdateMock,
  },
};

beforeEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  requireRoleMock.mockResolvedValue(actor);
  findActiveAssignmentByEquipmentMock.mockResolvedValue(null);
  findAssignmentByIdOrThrowMock.mockResolvedValue(activeAssignment);
  assignmentCreateMock.mockResolvedValue({ ...activeAssignment });
  assignmentUpdateManyMock.mockResolvedValue({ count: 1 });
  equipmentUpdateManyMock.mockResolvedValue({ count: 1 });
  equipmentFindUniqueOrThrowMock.mockResolvedValue({ status: "ASSIGNED" });
  equipmentUpdateMock.mockResolvedValue({ status: "AVAILABLE" });
  writeAuditEventMock.mockResolvedValue({ id: 501 });
  transactionMock.mockImplementation(
    async (callback: (transaction: typeof tx) => unknown) => callback(tx),
  );
});

describe("auditoría de operaciones de Assignment", () => {
  it("registra la creación con actor y estado del equipo en la misma transacción", async () => {
    await createAssignment({ employeeId: 15, equipmentId: 26 });

    expect(requireRoleMock).toHaveBeenCalledWith("ADMIN", "IT");
    expect(transactionMock).toHaveBeenCalledWith(expect.any(Function));
    expect(equipmentUpdateManyMock).toHaveBeenCalledWith({
      where: { id: 26, status: "AVAILABLE" },
      data: { status: "ASSIGNED" },
    });
    expect(writeAuditEventMock).toHaveBeenCalledWith(tx, {
      actor,
      action: "ASSIGNMENT_CREATED",
      entityType: "ASSIGNMENT",
      entityId: "80",
      outcome: "SUCCESS",
      source: "assignment.create",
      after: {
        employeeId: 15,
        equipmentId: 26,
        assignedAt: assignedAt.toISOString(),
        returnedAt: null,
        cancelledAt: null,
        equipmentStatus: "ASSIGNED",
      },
    });
    expect(writeAuditEventMock.mock.calls).toHaveLength(1);
  });

  it("registra solo la transición de devolución confirmada por la actualización condicional", async () => {
    assignmentUpdateManyMock.mockResolvedValue({ count: 1 });
    vi.useFakeTimers();
    vi.setSystemTime(returnedAt);

    await returnAssignment(80);

    expect(assignmentUpdateManyMock).toHaveBeenCalledWith({
      where: { id: 80, returnedAt: null, cancelledAt: null },
      data: { returnedAt },
    });
    expect(equipmentUpdateMock).toHaveBeenCalledWith({
      where: { id: 26 },
      data: { status: "AVAILABLE" },
    });
    expect(writeAuditEventMock).toHaveBeenCalledWith(tx, {
      actor,
      action: "ASSIGNMENT_RETURNED",
      entityType: "ASSIGNMENT",
      entityId: "80",
      outcome: "SUCCESS",
      source: "assignment.return",
      before: {
        employeeId: 15,
        equipmentId: 26,
        assignedAt: assignedAt.toISOString(),
        returnedAt: null,
        cancelledAt: null,
        equipmentStatus: "ASSIGNED",
      },
      after: {
        employeeId: 15,
        equipmentId: 26,
        assignedAt: assignedAt.toISOString(),
        returnedAt: returnedAt.toISOString(),
        cancelledAt: null,
        equipmentStatus: "AVAILABLE",
      },
    });
    expect(writeAuditEventMock.mock.calls).toHaveLength(1);
  });

  it("registra la cancelación como transición distinta y omite el texto libre del motivo", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(cancelledAt);

    await cancelAssignment(80, "Captura duplicada");

    expect(assignmentUpdateManyMock).toHaveBeenCalledWith({
      where: { id: 80, returnedAt: null, cancelledAt: null },
      data: { cancelledAt, cancellationReason: "Captura duplicada" },
    });
    expect(writeAuditEventMock).toHaveBeenCalledWith(tx, {
      actor,
      action: "ASSIGNMENT_CANCELLED",
      entityType: "ASSIGNMENT",
      entityId: "80",
      outcome: "SUCCESS",
      source: "assignment.cancel",
      before: {
        employeeId: 15,
        equipmentId: 26,
        assignedAt: assignedAt.toISOString(),
        returnedAt: null,
        cancelledAt: null,
        equipmentStatus: "ASSIGNED",
      },
      after: {
        employeeId: 15,
        equipmentId: 26,
        assignedAt: assignedAt.toISOString(),
        returnedAt: null,
        cancelledAt: cancelledAt.toISOString(),
        equipmentStatus: "AVAILABLE",
      },
    });
    expect(JSON.stringify(writeAuditEventMock.mock.calls)).not.toContain(
      "Captura duplicada",
    );
    expect(writeAuditEventMock.mock.calls).toHaveLength(1);
  });

  it("rechaza antes de consultar o escribir si no se autoriza al actor", async () => {
    requireRoleMock.mockRejectedValue(new Error("Forbidden"));

    await expect(createAssignment({ employeeId: 15, equipmentId: 26 })).rejects.toThrow(
      "Forbidden",
    );
    await expect(returnAssignment(80)).rejects.toThrow("Forbidden");
    await expect(cancelAssignment(80, "Motivo")).rejects.toThrow("Forbidden");

    expect(findActiveAssignmentByEquipmentMock).not.toHaveBeenCalled();
    expect(findAssignmentByIdOrThrowMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
    expect(writeAuditEventMock).not.toHaveBeenCalled();
  });

  it("no emite eventos ante asignación activa o transición repetida", async () => {
    findActiveAssignmentByEquipmentMock.mockResolvedValue({ id: 77 });
    await expect(createAssignment({ employeeId: 15, equipmentId: 26 })).rejects.toThrow(
      "El equipo ya se encuentra asignado.",
    );

    findActiveAssignmentByEquipmentMock.mockResolvedValue(null);
    assignmentUpdateManyMock.mockResolvedValue({ count: 0 });
    await expect(returnAssignment(80)).rejects.toThrow(
      "La asignación ya fue devuelta o anulada.",
    );
    await expect(cancelAssignment(80, "Motivo")).rejects.toThrow(
      "La asignación ya fue devuelta o anulada.",
    );

    expect(equipmentUpdateMock).not.toHaveBeenCalled();
    expect(writeAuditEventMock).not.toHaveBeenCalled();
  });

  it("propaga fallos de auditoría y no informa una operación exitosa", async () => {
    writeAuditEventMock.mockRejectedValue(new Error("audit insert failed"));

    await expect(createAssignment({ employeeId: 15, equipmentId: 26 })).rejects.toThrow(
      "audit insert failed",
    );
    await expect(returnAssignment(80)).rejects.toThrow("audit insert failed");
    await expect(cancelAssignment(80, "Motivo")).rejects.toThrow(
      "audit insert failed",
    );

    expect(transactionMock).toHaveBeenCalledTimes(3);
  });
});
