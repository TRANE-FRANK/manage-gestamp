import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireRoleMock,
  findPermitByIdMock,
  updatePermitGeneratedDocumentMock,
  transactionMock,
  writeAuditEventMock,
  findFirstMock,
  ensureDirectoryMock,
  execFileMock,
  execFilePromiseMock,
  fsMock,
  workbook,
  tx,
} = vi.hoisted(() => {
  const worksheet = { getCell: vi.fn(() => ({ value: null })) };
  const workbook = {
    xlsx: { readFile: vi.fn(), writeFile: vi.fn() },
    getWorksheet: vi.fn(() => worksheet),
  };
  const updatePermitGeneratedDocumentMock = vi.fn();
  const findFirstMock = vi.fn();
  const tx = {
    permit: { update: updatePermitGeneratedDocumentMock },
    auditEvent: { create: vi.fn() },
  };
  const execFilePromiseMock = vi.fn();
  const execFileMock = vi.fn();
  Object.defineProperty(execFileMock, Symbol.for("nodejs.util.promisify.custom"), {
    value: execFilePromiseMock,
  });
  return {
    requireRoleMock: vi.fn(),
    findPermitByIdMock: vi.fn(),
    updatePermitGeneratedDocumentMock,
    transactionMock: vi.fn(),
    writeAuditEventMock: vi.fn(),
    findFirstMock,
    ensureDirectoryMock: vi.fn(),
    execFileMock,
    execFilePromiseMock,
    fsMock: { unlink: vi.fn(), access: vi.fn() },
    workbook,
    tx,
  };
});

vi.mock("@/lib/auth/authorization", () => ({ requireRole: requireRoleMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: transactionMock, permit: { findFirst: findFirstMock } },
}));
vi.mock("@/services/audit/service", () => ({ writeAuditEvent: writeAuditEventMock }));
vi.mock("@/services/shared/storage", () => ({ ensureDirectory: ensureDirectoryMock }));
vi.mock("@/services/permit/repository", () => ({
  findPermitById: findPermitByIdMock,
  updatePermitGeneratedDocument: updatePermitGeneratedDocumentMock,
}));
vi.mock("exceljs", () => ({ default: { Workbook: class { constructor() { return workbook; } } } }));
vi.mock("child_process", () => ({ execFile: execFileMock }));
vi.mock("fs/promises", () => ({ default: fsMock }));

import { generatePermitDocument } from "@/services/permit/document";

const actor = { id: 7, username: "it.operator", role: "IT" as const };
const permit = {
  id: 10,
  folio: "PERM-010",
  employee: {
    sapNumber: "SAP-10",
    firstName: "Employee",
    lastName: "Example",
    position: "Technician",
    department: "IT",
  },
  equipment: {
    serialNumber: "SER-10",
    assetTag: "TAG-10",
    model: "Model",
    brand: "Brand",
    type: "LAPTOP",
  },
  startDate: new Date("2026-10-01T00:00:00.000Z"),
  expirationDate: new Date("2027-10-01T00:00:00.000Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  requireRoleMock.mockResolvedValue(actor);
  findPermitByIdMock.mockResolvedValue(permit);
  transactionMock.mockImplementation(
    async (callback: (client: typeof tx) => unknown) => callback(tx),
  );
  updatePermitGeneratedDocumentMock.mockResolvedValue({ id: 10 });
  writeAuditEventMock.mockResolvedValue({ id: 1 });
  findFirstMock.mockResolvedValue(null);
  ensureDirectoryMock.mockResolvedValue("/safe/storage/permits/generated");
  execFilePromiseMock.mockResolvedValue({ stdout: "", stderr: "" });
  fsMock.access.mockResolvedValue(undefined);
  fsMock.unlink.mockResolvedValue(undefined);
});

describe("auditoría de generación documental de Permit", () => {
  it("guarda la ruta y el evento en una transacción con actor verificado", async () => {
    const result = await generatePermitDocument(10);

    expect(transactionMock).toHaveBeenCalledOnce();
    expect(updatePermitGeneratedDocumentMock).toHaveBeenCalledWith(
      10,
      result.relativePath,
      tx,
    );
    expect(writeAuditEventMock).toHaveBeenCalledWith(tx, {
      actor,
      action: "PERMIT_DOCUMENT_GENERATED",
      entityType: "PERMIT",
      entityId: "10",
      outcome: "SUCCESS",
      source: "permit.document.generate",
    });
    expect(JSON.stringify(writeAuditEventMock.mock.calls)).not.toContain(".pdf");
  });

  it("propaga un fallo de auditoría y elimina solo el PDF nuevo sin referencia", async () => {
    writeAuditEventMock.mockRejectedValue(new Error("audit insert failed"));

    await expect(generatePermitDocument(10)).rejects.toThrow("audit insert failed");

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { generatedPdfPath: expect.stringContaining("PERM-010-") },
      select: { id: true },
    });
    expect(fsMock.unlink).toHaveBeenCalledTimes(2);
    expect(fsMock.unlink).toHaveBeenCalledWith(
      expect.stringContaining("PERM-010-"),
    );
  });

  it("rechaza antes de leer el permiso o crear archivos cuando falta autorización", async () => {
    requireRoleMock.mockRejectedValue(new Error("Forbidden"));

    await expect(generatePermitDocument(10)).rejects.toThrow("Forbidden");

    expect(findPermitByIdMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
    expect(ensureDirectoryMock).not.toHaveBeenCalled();
    expect(writeAuditEventMock).not.toHaveBeenCalled();
  });
});
