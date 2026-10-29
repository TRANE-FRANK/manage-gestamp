import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireRoleMock,
  migrationQueryMock,
  lockQueryMock,
  equipmentFindManyMock,
  existingFindManyMock,
  batchCreateMock,
  maintenanceCreateManyAndReturnMock,
  writeAuditEventMock,
  transactionMock,
} = vi.hoisted(() => ({
  requireRoleMock: vi.fn(),
  migrationQueryMock: vi.fn(),
  lockQueryMock: vi.fn(),
  equipmentFindManyMock: vi.fn(),
  existingFindManyMock: vi.fn(),
  batchCreateMock: vi.fn(),
  maintenanceCreateManyAndReturnMock: vi.fn(),
  writeAuditEventMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/authorization", () => ({ requireRole: requireRoleMock }));
vi.mock("@/services/audit/service", () => ({
  writeAuditEvent: writeAuditEventMock,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: migrationQueryMock,
    $transaction: transactionMock,
  },
}));
vi.mock("@/generated/prisma/client", () => ({
  Prisma: {
    join: (values: number[]) => values,
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;

      constructor(code: string) {
        super(code);
        this.code = code;
      }
    },
  },
}));

import { registerMaintenanceBatch } from "@/services/maintenance/service";

const actor = { id: 34, username: "it.operator", role: "IT" as const };
const maintenanceDate = new Date("2026-10-26T00:00:00.000Z");

const makeTransactionClient = () => ({
  $queryRaw: lockQueryMock,
  equipment: { findMany: equipmentFindManyMock },
  maintenance: {
    findMany: existingFindManyMock,
    createManyAndReturn: maintenanceCreateManyAndReturnMock,
  },
  maintenanceBatch: { create: batchCreateMock },
});

function register(equipmentIds = [21]) {
  return registerMaintenanceBatch({
    maintenanceDate: "2026-10-26",
    provider: "Proveedor de prueba",
    notes: "Nota que no debe quedar en el evento",
    equipmentIds,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  requireRoleMock.mockResolvedValue(actor);
  migrationQueryMock.mockResolvedValue([{ ready: true }]);
  lockQueryMock.mockImplementation(async (_query, ids: number[]) =>
    ids.map((id) => ({ id })),
  );
  equipmentFindManyMock.mockImplementation(async ({ where }) =>
    where.id.in.map((id: number) => ({
      id,
      company: "GP2",
      type: "LAPTOP",
    })),
  );
  existingFindManyMock.mockResolvedValue([]);
  batchCreateMock.mockResolvedValue({ id: 71 });
  maintenanceCreateManyAndReturnMock.mockImplementation(async ({ data }) =>
    data.map((item: { equipmentId: number; batchId: number; provider: string | null }) => ({
      id: item.equipmentId + 100,
      equipmentId: item.equipmentId,
      maintenanceDate,
      batchId: item.batchId,
      provider: item.provider,
    })),
  );
  writeAuditEventMock.mockResolvedValue({ id: 501 });
  transactionMock.mockImplementation(
    async (callback: (tx: ReturnType<typeof makeTransactionClient>) => unknown) =>
      callback(makeTransactionClient()),
  );
});

describe("auditoría de mantenimiento preventivo", () => {
  it("autoriza antes de escribir y registra un mantenimiento individual con su actor", async () => {
    const result = await register();

    expect(requireRoleMock).toHaveBeenCalledWith("ADMIN", "IT");
    expect(transactionMock).toHaveBeenCalledOnce();
    expect(result).toEqual({ batchId: 71, count: 1 });
    expect(writeAuditEventMock).toHaveBeenCalledOnce();
    expect(writeAuditEventMock).toHaveBeenCalledWith(
      expect.anything(),
      {
        actor,
        action: "MAINTENANCE_CREATED",
        entityType: "MAINTENANCE",
        entityId: "121",
        outcome: "SUCCESS",
        source: "maintenance.register-batch",
        after: {
          equipmentId: 21,
          maintenanceDate: "2026-10-26",
          batchId: 71,
          provider: "Proveedor de prueba",
        },
      },
    );
  });

  it("registra cada fila del lote una sola vez y conserva la relación común", async () => {
    await register([21, 22]);

    expect(maintenanceCreateManyAndReturnMock).toHaveBeenCalledOnce();
    expect(maintenanceCreateManyAndReturnMock.mock.calls[0]?.[0].data).toHaveLength(2);
    expect(writeAuditEventMock).toHaveBeenCalledTimes(2);
    expect(writeAuditEventMock.mock.calls.map(([, event]) => event)).toEqual([
      expect.objectContaining({
        entityId: "121",
        after: expect.objectContaining({ equipmentId: 21, batchId: 71 }),
      }),
      expect.objectContaining({
        entityId: "122",
        after: expect.objectContaining({ equipmentId: 22, batchId: 71 }),
      }),
    ]);

    for (const [, event] of writeAuditEventMock.mock.calls) {
      expect(event.after).not.toHaveProperty("notes");
      expect(event.after).not.toHaveProperty("generatedPdfPath");
      expect(event.after).not.toHaveProperty("signedPdfPath");
    }
  });

  it("no confía en una identidad o rol adicionales enviados en los datos", async () => {
    await registerMaintenanceBatch({
      maintenanceDate: "2026-10-26",
      provider: "Proveedor de prueba",
      notes: "",
      equipmentIds: [21],
      actor: { id: 999, username: "spoofed", role: "ADMIN" },
      role: "ADMIN",
    } as never);

    expect(writeAuditEventMock.mock.calls[0]?.[1].actor).toEqual(actor);
    expect(writeAuditEventMock.mock.calls[0]?.[1].actor).not.toEqual({
      id: 999,
      username: "spoofed",
      role: "ADMIN",
    });
  });

  it("no inicia una transacción si la autorización falla", async () => {
    const accessError = new Error("forbidden");
    requireRoleMock.mockRejectedValue(accessError);

    await expect(register()).rejects.toBe(accessError);

    expect(migrationQueryMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
    expect(maintenanceCreateManyAndReturnMock).not.toHaveBeenCalled();
    expect(writeAuditEventMock).not.toHaveBeenCalled();
  });

  it("propaga fallos de auditoría para que la transacción de negocio falle", async () => {
    const auditError = new Error("audit insert failed");
    writeAuditEventMock.mockRejectedValue(auditError);

    await expect(register([21, 22])).rejects.toBe(auditError);

    expect(maintenanceCreateManyAndReturnMock).toHaveBeenCalledOnce();
    expect(writeAuditEventMock).toHaveBeenCalledTimes(1);
  });

  it("mantiene el conflicto de unicidad como error de negocio sin crear evento", async () => {
    existingFindManyMock.mockResolvedValue([{ equipmentId: 21 }]);

    await expect(register()).rejects.toThrow(
      "Uno o más equipos ya tienen un mantenimiento registrado en esa fecha.",
    );

    expect(batchCreateMock).not.toHaveBeenCalled();
    expect(maintenanceCreateManyAndReturnMock).not.toHaveBeenCalled();
    expect(writeAuditEventMock).not.toHaveBeenCalled();
  });
});
