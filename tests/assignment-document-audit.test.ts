import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireRoleMock,
  transactionMock,
  writeAuditEventMock,
  assignmentFindUniqueMock,
  assignmentUpdateManyMock,
  assignmentFindFirstMock,
  ensureDirectoryMock,
  convertExcelToPdfMock,
  fsMock,
  workbook,
  tx,
} = vi.hoisted(() => {
  const worksheet = { getCell: vi.fn(() => ({ value: null })), pageSetup: {} };
  const workbook = {
    xlsx: { readFile: vi.fn(), writeFile: vi.fn() },
    getWorksheet: vi.fn(() => worksheet),
    removeWorksheet: vi.fn(),
  };
  const assignmentFindUniqueMock = vi.fn();
  const assignmentUpdateManyMock = vi.fn();
  const assignmentFindFirstMock = vi.fn();
  const tx = {
    assignment: {
      updateMany: assignmentUpdateManyMock,
      findUnique: assignmentFindUniqueMock,
      findFirst: assignmentFindFirstMock,
    },
    auditEvent: { create: vi.fn() },
  };
  return {
    requireRoleMock: vi.fn(),
    transactionMock: vi.fn(),
    writeAuditEventMock: vi.fn(),
    assignmentFindUniqueMock,
    assignmentUpdateManyMock,
    assignmentFindFirstMock,
    ensureDirectoryMock: vi.fn(),
    convertExcelToPdfMock: vi.fn(),
    fsMock: {
      mkdtemp: vi.fn(),
      open: vi.fn(),
      readFile: vi.fn(),
      rm: vi.fn(),
      unlink: vi.fn(),
    },
    workbook,
    tx,
  };
});

vi.mock("@/lib/auth/authorization", () => ({ requireRole: requireRoleMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
    assignment: {
      findUnique: assignmentFindUniqueMock,
      findFirst: assignmentFindFirstMock,
    },
  },
}));
vi.mock("@/services/audit/service", () => ({ writeAuditEvent: writeAuditEventMock }));
vi.mock("@/services/shared/storage", () => ({ ensureDirectory: ensureDirectoryMock }));
vi.mock("@/services/shared/pdf", () => ({ convertExcelToPdf: convertExcelToPdfMock }));
vi.mock("@/lib/equipment/config", () => ({
  equipmentTypeConfig: { LAPTOP: { hasResponsiva: true } },
}));
vi.mock("exceljs", () => ({ default: { Workbook: class { constructor() { return workbook; } } } }));
vi.mock("fs/promises", () => ({ default: fsMock }));

import { generateAssignmentDocument } from "@/services/assignment/document";
import { uploadSignedPdf } from "@/services/assignment/upload";

const actor = { id: 7, username: "it.operator", role: "IT" as const };
const assignment = {
  id: 45,
  employee: {
    firstName: "Employee",
    lastName: "Example",
    department: "Operations",
    sapNumber: "SAP-45",
  },
  equipment: {
    type: "LAPTOP",
    brand: "Brand",
    model: "Model",
    serialNumber: "SER-45",
    assetTag: "TAG-45",
    inventoryNumber: "INV-45",
  },
  assignedAt: new Date("2026-10-01T00:00:00.000Z"),
  returnedAt: null,
  cancelledAt: null,
  generatedPdfPath: "assignments/generated/RESP-45.pdf",
};

beforeEach(() => {
  vi.clearAllMocks();
  requireRoleMock.mockResolvedValue(actor);
  transactionMock.mockImplementation(
    async (callback: (client: typeof tx) => unknown) => callback(tx),
  );
  writeAuditEventMock.mockResolvedValue({ id: 1 });
  assignmentFindUniqueMock.mockResolvedValue(assignment);
  assignmentFindFirstMock.mockResolvedValue(null);
  assignmentUpdateManyMock.mockResolvedValue({ count: 1 });
  ensureDirectoryMock.mockResolvedValue("/safe/storage/assignments/generated");
  convertExcelToPdfMock.mockResolvedValue("/tmp/source.pdf");
  fsMock.mkdtemp.mockResolvedValue("/safe/storage/assignments/generated/.tmp");
  fsMock.open.mockResolvedValue({ writeFile: vi.fn(), close: vi.fn() });
  fsMock.readFile.mockResolvedValue(Buffer.from("pdf"));
  fsMock.rm.mockResolvedValue(undefined);
  fsMock.unlink.mockResolvedValue(undefined);
});

describe("auditoría de documentos de Assignment", () => {
  it("registra generación en la transacción que guarda la ruta, sin incluirla en snapshots", async () => {
    const relativePath = await generateAssignmentDocument(45);

    expect(transactionMock).toHaveBeenCalledOnce();
    expect(assignmentUpdateManyMock).toHaveBeenCalledWith({
      where: { id: 45, returnedAt: null, cancelledAt: null },
      data: { generatedPdfPath: relativePath },
    });
    expect(writeAuditEventMock).toHaveBeenCalledWith(tx, {
      actor,
      action: "ASSIGNMENT_DOCUMENT_GENERATED",
      entityType: "ASSIGNMENT",
      entityId: "45",
      outcome: "SUCCESS",
      source: "assignment.document.generate",
    });
    expect(JSON.stringify(writeAuditEventMock.mock.calls)).not.toContain(relativePath);
  });

  it("registra carga firmada dentro de la transacción y no expone la ruta", async () => {
    const file = new File(["signed"], "signed.pdf", { type: "application/pdf" });
    await uploadSignedPdf(45, file);

    expect(transactionMock).toHaveBeenCalledOnce();
    expect(assignmentUpdateManyMock).toHaveBeenCalledWith({
      where: { id: 45, returnedAt: null, cancelledAt: null },
      data: { signedPdfPath: expect.stringContaining("FIRMADA.pdf") },
    });
    expect(writeAuditEventMock).toHaveBeenCalledWith(tx, {
      actor,
      action: "ASSIGNMENT_SIGNED_DOCUMENT_UPLOADED",
      entityType: "ASSIGNMENT",
      entityId: "45",
      outcome: "SUCCESS",
      source: "assignment.document.upload-signed",
    });
    expect(JSON.stringify(writeAuditEventMock.mock.calls)).not.toContain("signed.pdf");
  });

  it("no devuelve éxito ni conserva el archivo nuevo si falla la auditoría", async () => {
    writeAuditEventMock.mockRejectedValue(new Error("audit insert failed"));

    await expect(generateAssignmentDocument(45)).rejects.toThrow("audit insert failed");
    expect(assignmentFindFirstMock).toHaveBeenCalledWith({
      where: { generatedPdfPath: expect.any(String) },
      select: { id: true },
    });
    expect(fsMock.unlink).toHaveBeenCalledOnce();
  });

  it("rechaza sin rol antes de generar archivos, leer datos o abrir la transacción", async () => {
    requireRoleMock.mockRejectedValue(new Error("Forbidden"));

    await expect(generateAssignmentDocument(45)).rejects.toThrow("Forbidden");
    await expect(
      uploadSignedPdf(
        45,
        new File(["signed"], "signed.pdf", { type: "application/pdf" }),
      ),
    ).rejects.toThrow("Forbidden");

    expect(assignmentFindUniqueMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
    expect(ensureDirectoryMock).not.toHaveBeenCalled();
    expect(writeAuditEventMock).not.toHaveBeenCalled();
  });
});
