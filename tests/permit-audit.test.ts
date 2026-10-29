import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireRoleMock,
  findPermitByFolioMock,
  findPermitByIdMock,
  findActivePermitByEquipmentIdMock,
  findPermitsMock,
  findPermitsPaginatedMock,
  permitCreateMock,
  permitFindUniqueMock,
  permitFindFirstMock,
  permitUpdateManyMock,
  permitFindUniqueOrThrowMock,
  transactionMock,
  writeAuditEventMock,
  findPermitPathReferenceMock,
  ensureDirectoryMock,
  writeFileMock,
  unlinkMock,
} = vi.hoisted(() => ({
  requireRoleMock: vi.fn(),
  findPermitByFolioMock: vi.fn(),
  findPermitByIdMock: vi.fn(),
  findActivePermitByEquipmentIdMock: vi.fn(),
  findPermitsMock: vi.fn(),
  findPermitsPaginatedMock: vi.fn(),
  permitCreateMock: vi.fn(),
  permitFindUniqueMock: vi.fn(),
  permitFindFirstMock: vi.fn(),
  permitUpdateManyMock: vi.fn(),
  permitFindUniqueOrThrowMock: vi.fn(),
  transactionMock: vi.fn(),
  writeAuditEventMock: vi.fn(),
  findPermitPathReferenceMock: vi.fn(),
  ensureDirectoryMock: vi.fn(),
  writeFileMock: vi.fn(),
  unlinkMock: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", () => ({ requireRole: requireRoleMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
    permit: { findFirst: findPermitPathReferenceMock },
  },
}));
vi.mock("@/services/audit/service", () => ({ writeAuditEvent: writeAuditEventMock }));
vi.mock("@/services/shared/storage", () => ({ ensureDirectory: ensureDirectoryMock }));
vi.mock("fs/promises", () => ({ writeFile: writeFileMock, unlink: unlinkMock }));
vi.mock("@/services/permit/repository", () => ({
  findPermitByFolio: findPermitByFolioMock,
  findPermitById: findPermitByIdMock,
  findActivePermitByEquipmentId: findActivePermitByEquipmentIdMock,
  findPermits: findPermitsMock,
  findPermitsPaginated: findPermitsPaginatedMock,
}));

import {
  authorizeExceptionalDeparture,
  authorizePermitDeparture,
  cancelPermit,
  createPermit,
  renewPermit,
  setPermitDepartureAuthorization,
} from "@/services/permit/service";
import { uploadSignedPermitPdf } from "@/services/permit/upload";

const actor = { id: 34, username: "admin.operator", role: "ADMIN" as const };
const startDate = new Date("2026-10-01T00:00:00.000Z");
const expirationDate = new Date("2027-10-01T00:00:00.000Z");
const authorizedAt = new Date("2026-10-20T12:00:00.000Z");
const activePermit = {
  id: 10,
  folio: "PERM-001",
  employeeId: 21,
  equipmentId: 31,
  startDate,
  expirationDate,
  status: "ACTIVE",
  departureAuthorized: false,
  departureAuthorizedAt: null,
  departureAuthorizationReason: null,
  cancelledAt: null,
  cancellationReason: null,
  generatedPdfPath: "private/generated.pdf",
  signedPdfPath: null,
  employee: { id: 21, firstName: "Name", lastName: "Example" },
  equipment: { id: 31, assetTag: "ASSET-31" },
};

const tx = {
  permit: {
    create: permitCreateMock,
    findUnique: permitFindUniqueMock,
    findFirst: permitFindFirstMock,
    updateMany: permitUpdateManyMock,
    findUniqueOrThrow: permitFindUniqueOrThrowMock,
  },
};

beforeEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  requireRoleMock.mockResolvedValue(actor);
  findPermitByFolioMock.mockResolvedValue(null);
  findPermitByIdMock.mockResolvedValue(activePermit);
  findActivePermitByEquipmentIdMock.mockResolvedValue(null);
  permitFindUniqueMock.mockResolvedValue({
    id: 10,
    folio: "PERM-001",
    employeeId: 21,
    equipmentId: 31,
    startDate,
    expirationDate,
    status: "ACTIVE",
    departureAuthorized: false,
  });
  permitFindFirstMock.mockResolvedValue(null);
  permitUpdateManyMock.mockResolvedValue({ count: 1 });
  permitFindUniqueOrThrowMock.mockResolvedValue(activePermit);
  permitCreateMock.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve({
      ...data,
      id: 11,
      departureAuthorized: false,
      employee: activePermit.employee,
      equipment: activePermit.equipment,
    }),
  );
  transactionMock.mockImplementation(
    async (callback: (transaction: typeof tx) => unknown) => callback(tx),
  );
  writeAuditEventMock.mockResolvedValue({ id: 900 });
  findPermitPathReferenceMock.mockResolvedValue(null);
  ensureDirectoryMock.mockResolvedValue("/safe/storage/permits/signed");
  writeFileMock.mockResolvedValue(undefined);
  unlinkMock.mockResolvedValue(undefined);
});

describe("auditoría del ciclo de vida de permisos", () => {
  it("registra la creación con actor y solo campos permitidos", async () => {
    await createPermit({
      folio: "PERM-002",
      employeeId: 21,
      equipmentId: 31,
      startDate,
      expirationDate,
    });

    expect(requireRoleMock).toHaveBeenCalledWith("ADMIN", "IT");
    expect(writeAuditEventMock).toHaveBeenCalledWith(tx, {
      actor,
      action: "PERMIT_CREATED",
      entityType: "PERMIT",
      entityId: "11",
      outcome: "SUCCESS",
      source: "permit.create",
      after: {
        folio: "PERM-002",
        employeeId: 21,
        equipmentId: 31,
        startDate: startDate.toISOString(),
        expirationDate: expirationDate.toISOString(),
        status: "ACTIVE",
        departureAuthorized: false,
      },
    });
    expect(JSON.stringify(writeAuditEventMock.mock.calls)).not.toContain("generatedPdfPath");
    expect(transactionMock).toHaveBeenCalledOnce();
  });

  it("ignora identidad y rol falsificados que lleguen junto con los datos del permiso", async () => {
    const input = {
      folio: "PERM-002",
      employeeId: 21,
      equipmentId: 31,
      startDate,
      expirationDate,
      userId: 999,
      role: "SECURITY",
      actor: { id: 999, username: "forged", role: "SECURITY" },
    } as Parameters<typeof createPermit>[0];

    await createPermit(input);

    expect(requireRoleMock).toHaveBeenCalledWith("ADMIN", "IT");
    expect(permitCreateMock.mock.calls[0][0].data).toEqual({
      folio: "PERM-002",
      employeeId: 21,
      equipmentId: 31,
      startDate,
      expirationDate,
      status: "ACTIVE",
    });
    expect(writeAuditEventMock.mock.calls[0][1].actor).toEqual(actor);
  });

  it("registra la renovación y vincula el permiso anterior con el nuevo", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-10-02T00:00:00.000Z"));
    permitFindUniqueMock.mockResolvedValue({
      id: 10,
      folio: "PERM-001",
      employeeId: 21,
      equipmentId: 31,
      startDate,
      expirationDate,
      status: "ACTIVE",
      departureAuthorized: false,
    });

    await renewPermit({ permitId: 10, startDate: expirationDate, expirationDate: new Date("2028-10-01T00:00:00.000Z") });

    expect(writeAuditEventMock).toHaveBeenNthCalledWith(1, tx, {
      actor,
      action: "PERMIT_RENEWED",
      entityType: "PERMIT",
      entityId: "10",
      outcome: "SUCCESS",
      source: "permit.renewal",
      before: {
        folio: "PERM-001",
        employeeId: 21,
        equipmentId: 31,
        startDate: startDate.toISOString(),
        expirationDate: expirationDate.toISOString(),
        status: "ACTIVE",
        departureAuthorized: false,
      },
      after: {
        folio: "PERM-001",
        employeeId: 21,
        equipmentId: 31,
        startDate: startDate.toISOString(),
        expirationDate: expirationDate.toISOString(),
        status: "EXPIRED",
        departureAuthorized: false,
        replacementPermitId: 11,
      },
    });
    expect(writeAuditEventMock).toHaveBeenNthCalledWith(2, tx, {
      actor,
      action: "PERMIT_CREATED",
      entityType: "PERMIT",
      entityId: "11",
      outcome: "SUCCESS",
      source: "permit.renewal",
      after: expect.objectContaining({
        folio: "PERM-2",
        status: "ACTIVE",
        renewedFromPermitId: 10,
      }),
    });
    expect(writeAuditEventMock).toHaveBeenCalledTimes(2);
  });

  it("al renovar un permiso ya expirado registra solo la nueva alta", async () => {
    findPermitByIdMock.mockResolvedValue({ ...activePermit, status: "EXPIRED" });
    permitFindUniqueMock.mockResolvedValue({
      id: 10,
      folio: "PERM-001",
      employeeId: 21,
      equipmentId: 31,
      startDate,
      expirationDate,
      status: "EXPIRED",
      departureAuthorized: false,
    });

    await renewPermit({
      permitId: 10,
      startDate: expirationDate,
      expirationDate: new Date("2028-10-01T00:00:00.000Z"),
    });

    expect(permitUpdateManyMock).not.toHaveBeenCalled();
    expect(writeAuditEventMock).toHaveBeenCalledTimes(1);
    expect(writeAuditEventMock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: "PERMIT_CREATED",
        entityId: "11",
        after: expect.objectContaining({ renewedFromPermitId: 10 }),
      }),
    );
  });

  it("registra cancelación sin copiar el motivo de texto libre", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(authorizedAt);

    await cancelPermit(10, "Cancelación por cambio operativo");

    expect(permitUpdateManyMock).toHaveBeenCalledWith({
      where: {
        id: 10,
        status: "ACTIVE",
        departureAuthorized: false,
        cancelledAt: null,
      },
      data: {
        status: "CANCELLED",
        cancelledAt: authorizedAt,
        cancellationReason: "Cancelación por cambio operativo",
      },
    });
    expect(writeAuditEventMock).toHaveBeenCalledWith(tx, {
      actor,
      action: "PERMIT_CANCELLED",
      entityType: "PERMIT",
      entityId: "10",
      outcome: "SUCCESS",
      source: "permit.cancel",
      before: expect.objectContaining({ status: "ACTIVE", cancelledAt: null }),
      after: expect.objectContaining({
        status: "CANCELLED",
        cancelledAt: authorizedAt.toISOString(),
      }),
    });
    expect(JSON.stringify(writeAuditEventMock.mock.calls)).not.toContain(
      "Cancelación por cambio operativo",
    );
  });

  it("registra autorización excepcional con transición y fecha, sin copiar el motivo", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(authorizedAt);

    await authorizeExceptionalDeparture(10, "Salida excepcional aprobada");

    expect(permitUpdateManyMock).toHaveBeenCalledWith({
      where: {
        id: 10,
        status: "ACTIVE",
        departureAuthorized: false,
        departureAuthorizedAt: null,
      },
      data: {
        departureAuthorized: true,
        departureAuthorizedAt: authorizedAt,
        departureAuthorizationReason: "Salida excepcional aprobada",
      },
    });
    expect(writeAuditEventMock).toHaveBeenCalledWith(tx, {
      actor,
      action: "PERMIT_EXCEPTIONAL_DEPARTURE_AUTHORIZED",
      entityType: "PERMIT",
      entityId: "10",
      outcome: "SUCCESS",
      source: "permit.exceptional-departure",
      before: expect.objectContaining({ departureAuthorized: false }),
      after: expect.objectContaining({
        departureAuthorized: true,
        departureAuthorizedAt: authorizedAt.toISOString(),
      }),
    });
    expect(JSON.stringify(writeAuditEventMock.mock.calls)).not.toContain(
      "Salida excepcional aprobada",
    );
  });

  it("registra autorización y revocación solo cuando el booleano realmente cambia", async () => {
    await setPermitDepartureAuthorization(10, true);
    expect(writeAuditEventMock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: "PERMIT_DEPARTURE_AUTHORIZED",
        before: expect.objectContaining({ departureAuthorized: false }),
        after: expect.objectContaining({ departureAuthorized: true }),
      }),
    );

    vi.clearAllMocks();
    requireRoleMock.mockResolvedValue(actor);
    findPermitByIdMock.mockResolvedValue({ ...activePermit, departureAuthorized: true });
    await setPermitDepartureAuthorization(10, false);

    expect(writeAuditEventMock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: "PERMIT_DEPARTURE_AUTHORIZATION_REVOKED",
        before: expect.objectContaining({ departureAuthorized: true }),
        after: expect.objectContaining({ departureAuthorized: false }),
      }),
    );

    vi.clearAllMocks();
    requireRoleMock.mockResolvedValue(actor);
    findPermitByIdMock.mockResolvedValue(activePermit);
    await setPermitDepartureAuthorization(10, false);
    expect(transactionMock).not.toHaveBeenCalled();
    expect(writeAuditEventMock).not.toHaveBeenCalled();
  });

  it("no duplica autorización normal cuando ya existe y no registra transición inválida", async () => {
    findPermitByIdMock.mockResolvedValue({ ...activePermit, departureAuthorized: true });
    await expect(authorizePermitDeparture(10)).rejects.toThrow(
      "La salida de este equipo ya está autorizada.",
    );
    expect(transactionMock).not.toHaveBeenCalled();
    expect(writeAuditEventMock).not.toHaveBeenCalled();

    findPermitByIdMock.mockResolvedValue({ ...activePermit, status: "CANCELLED" });
    await expect(cancelPermit(10, "Motivo válido")).rejects.toThrow(
      "El permiso ya está cancelado.",
    );
    expect(writeAuditEventMock).not.toHaveBeenCalled();
  });

  it("registra la autorización normal de salida a partir del permiso activo", async () => {
    await authorizePermitDeparture(10);

    expect(permitUpdateManyMock).toHaveBeenCalledWith({
      where: { id: 10, status: "ACTIVE", departureAuthorized: false },
      data: { departureAuthorized: true },
    });
    expect(writeAuditEventMock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        actor,
        action: "PERMIT_DEPARTURE_AUTHORIZED",
        before: expect.objectContaining({ departureAuthorized: false }),
        after: expect.objectContaining({ departureAuthorized: true }),
      }),
    );
  });

  it("rechaza un actor no autorizado antes de leer o escribir el permiso", async () => {
    requireRoleMock.mockRejectedValue(new Error("Forbidden"));

    await expect(createPermit({
      folio: "PERM-002",
      employeeId: 21,
      equipmentId: 31,
      startDate,
      expirationDate,
    })).rejects.toThrow("Forbidden");
    await expect(cancelPermit(10, "Motivo válido")).rejects.toThrow("Forbidden");
    expect(findPermitByFolioMock).not.toHaveBeenCalled();
    expect(findPermitByIdMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
    expect(writeAuditEventMock).not.toHaveBeenCalled();
  });

  it("audita el cambio de autorización provocado por carga firmada y revierte DB si falla", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(authorizedAt);
    const file = new File(["signed pdf"], "signed.pdf", { type: "application/pdf" });

    await uploadSignedPermitPdf(10, file);

    expect(writeFileMock).toHaveBeenCalledWith(
      expect.stringContaining("PERM-FIRMADO-PERM-001-"),
      expect.any(Buffer),
      { flag: "wx" },
    );
    expect(writeAuditEventMock).toHaveBeenNthCalledWith(1, tx, {
      actor,
      action: "PERMIT_SIGNED_DOCUMENT_UPLOADED",
      entityType: "PERMIT",
      entityId: "10",
      outcome: "SUCCESS",
      source: "permit.signed-document-upload",
    });
    expect(writeAuditEventMock).toHaveBeenCalledWith(tx, expect.objectContaining({
      action: "PERMIT_DEPARTURE_AUTHORIZED",
      source: "permit.signed-document-upload",
      before: expect.objectContaining({ departureAuthorized: false }),
      after: expect.objectContaining({ departureAuthorized: true }),
    }));
    expect(writeAuditEventMock).toHaveBeenCalledTimes(2);
    expect(unlinkMock).not.toHaveBeenCalled();

    vi.clearAllMocks();
    requireRoleMock.mockResolvedValue(actor);
    findPermitByIdMock.mockResolvedValue(activePermit);
    permitFindUniqueMock.mockResolvedValue({
      id: 10,
      folio: "PERM-001",
      employeeId: 21,
      equipmentId: 31,
      status: "ACTIVE",
      departureAuthorized: false,
    });
    writeFileMock.mockResolvedValue(undefined);
    writeAuditEventMock.mockRejectedValue(new Error("audit insert failed"));

    await expect(uploadSignedPermitPdf(10, file)).rejects.toThrow("audit insert failed");
    expect(findPermitPathReferenceMock).toHaveBeenCalledWith({
      where: { signedPdfPath: expect.stringContaining("PERM-FIRMADO-PERM-001-") },
      select: { id: true },
    });
    expect(unlinkMock).toHaveBeenCalledOnce();
  });

  it("conserva el PDF cargado si una transacción fallida pudo dejar su ruta confirmada", async () => {
    const file = new File(["signed pdf"], "signed.pdf", { type: "application/pdf" });
    findPermitPathReferenceMock.mockResolvedValue({ id: 10 });
    transactionMock.mockRejectedValue(new Error("commit confirmation failed"));

    await expect(uploadSignedPermitPdf(10, file)).rejects.toThrow(
      "commit confirmation failed",
    );

    expect(findPermitPathReferenceMock).toHaveBeenCalledOnce();
    expect(unlinkMock).not.toHaveBeenCalled();
  });

  it("audita una nueva carga firmada aunque la salida ya estuviera autorizada", async () => {
    permitFindUniqueMock.mockResolvedValue({
      id: 10,
      folio: "PERM-001",
      employeeId: 21,
      equipmentId: 31,
      status: "ACTIVE",
      departureAuthorized: true,
    });
    const file = new File(["signed pdf"], "signed.pdf", { type: "application/pdf" });

    await uploadSignedPermitPdf(10, file);

    expect(writeAuditEventMock).toHaveBeenCalledOnce();
    expect(writeAuditEventMock).toHaveBeenCalledWith(tx, {
      actor,
      action: "PERMIT_SIGNED_DOCUMENT_UPLOADED",
      entityType: "PERMIT",
      entityId: "10",
      outcome: "SUCCESS",
      source: "permit.signed-document-upload",
    });
  });

  it("propaga el fallo de auditoría para las transiciones de base de datos", async () => {
    writeAuditEventMock.mockRejectedValue(new Error("audit insert failed"));

    await expect(createPermit({
      folio: "PERM-002",
      employeeId: 21,
      equipmentId: 31,
      startDate,
      expirationDate,
    })).rejects.toThrow("audit insert failed");

    vi.clearAllMocks();
    requireRoleMock.mockResolvedValue(actor);
    findPermitByIdMock.mockResolvedValue(activePermit);
    permitUpdateManyMock.mockResolvedValue({ count: 1 });
    writeAuditEventMock.mockRejectedValue(new Error("audit insert failed"));
    await expect(cancelPermit(10, "Motivo válido")).rejects.toThrow("audit insert failed");
  });

  it("revierte en la transacción ambas partes de una renovación si falla el segundo evento", async () => {
    writeAuditEventMock
      .mockResolvedValueOnce({ id: 900 })
      .mockRejectedValueOnce(new Error("audit insert failed"));

    await expect(
      renewPermit({
        permitId: 10,
        startDate: expirationDate,
        expirationDate: new Date("2028-10-01T00:00:00.000Z"),
      }),
    ).rejects.toThrow("audit insert failed");

    expect(permitUpdateManyMock).toHaveBeenCalled();
    expect(permitCreateMock).toHaveBeenCalled();
    expect(writeAuditEventMock).toHaveBeenCalledTimes(2);
  });
});
