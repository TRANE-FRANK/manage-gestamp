import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  findUniqueMock,
  equipmentCreateMock,
  equipmentUpdateMock,
  employeeCreateMock,
  assignmentCreateMock,
  assignmentUpdateManyMock,
  assignmentFindUniqueMock,
  assignmentFindFirstMock,
  transactionMock,
  revalidatePathMock,
  redirectMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  findUniqueMock: vi.fn(),
  equipmentCreateMock: vi.fn(),
  equipmentUpdateMock: vi.fn(),
  employeeCreateMock: vi.fn(),
  assignmentCreateMock: vi.fn(),
  assignmentUpdateManyMock: vi.fn(),
  assignmentFindUniqueMock: vi.fn(),
  assignmentFindFirstMock: vi.fn(),
  transactionMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: findUniqueMock },
    equipment: { create: equipmentCreateMock, update: equipmentUpdateMock },
    employee: { create: employeeCreateMock },
    assignment: {
      create: assignmentCreateMock,
      updateMany: assignmentUpdateManyMock,
      findUnique: assignmentFindUniqueMock,
      findFirst: assignmentFindFirstMock,
    },
    $transaction: transactionMock,
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/generated/prisma/client", () => ({
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {},
  },
}));

import { createEquipment, updateEquipment } from "@/actions/equipment-actions";
import { GET as getEmployeeEquipment } from "@/app/api/employees/[id]/equipment/route";
import { GET as getGeneratedAssignmentDocument } from "@/app/api/documents/assignment/[id]/generated/route";
import { GET as getSignedAssignmentDocument } from "@/app/api/documents/assignment/[id]/signed/route";
import { createEmployee } from "@/actions/employee-actions";
import {
  cancelAssignmentAction,
  createAssignmentAction,
  returnAssignmentAction,
} from "@/actions/assignment-actions";
import { returnAssignmentAction as duplicateReturnAssignmentAction } from "@/actions/return-assignment";
import {
  generateResponsivaAction,
  uploadSignedPdfAction,
} from "@/actions/assignment-document-actions";
import { createAssignment } from "@/services/assignment/create";
import { returnAssignment } from "@/services/assignment/return";
import { cancelAssignment } from "@/services/assignment/cancel";
import { generateAssignmentDocument } from "@/services/assignment/document";
import { uploadSignedPdf } from "@/services/assignment/upload";
import {
  getActiveAssignmentsByEmployeeId,
  listActiveAssignmentsPaginated,
  listAssignmentHistoryPaginated,
} from "@/services/assignment/service";
import { getAssignmentDetails } from "@/services/assignment/details";
import { listActiveAssignments } from "@/services/assignment/list";
import { listAssignmentHistory } from "@/services/assignment/history";
import { getEquipmentDetails, listEquipmentPaginated } from "@/services/equipment/service";
import { getEmployeeDetails } from "@/services/employee/details";
import { listEmployees } from "@/services/employee/list";
import { readDocument } from "@/services/document/reader";
import {
  getEquipmentMaintenanceHistory,
  listEligibleMaintenanceEquipment,
  listMaintenanceHistory,
  registerMaintenanceBatch,
} from "@/services/maintenance/service";
import {
  requireRole,
  requireUser,
} from "@/lib/auth/authorization";

type TestUser = {
  id: number;
  username: string;
  role: "ADMIN" | "IT" | "SECURITY";
  isActive: boolean;
};

function setSession(id: unknown, role?: unknown) {
  authMock.mockResolvedValue({
    user: { id, role, username: "session-controlled" },
  });
}

function setDatabaseUser(user: Omit<TestUser, "isActive"> | null) {
  findUniqueMock.mockResolvedValue(user ? { ...user, isActive: true } : null);
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue(null);
  findUniqueMock.mockResolvedValue(null);
});

describe("requireUser", () => {
  it("rechaza una sesión ausente sin consultar usuarios", async () => {
    await expect(requireUser()).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("rechaza un identificador de sesión inválido", async () => {
    setSession("no-es-un-id");

    await expect(requireUser()).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("rechaza una cuenta que ya no existe", async () => {
    setSession("18");

    await expect(requireUser()).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: 18 },
      select: { id: true, username: true, role: true, isActive: true },
    });
  });

  it("rechaza una cuenta desactivada aunque conserve una sesión válida", async () => {
    setSession("18", "ADMIN");
    findUniqueMock.mockResolvedValue({
      id: 18,
      username: "disabled-admin",
      role: "ADMIN",
      isActive: false,
    });

    await expect(requireUser()).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });

  it("devuelve la identidad y el rol vigentes consultados en Prisma", async () => {
    setSession("7", "ADMIN");
    setDatabaseUser({ id: 7, username: "it-operator", role: "IT" });

    await expect(requireUser()).resolves.toEqual({
      id: 7,
      username: "it-operator",
      role: "IT",
    });
  });
});

describe("requireRole", () => {
  it("autoriza al usuario cuyo rol vigente está permitido", async () => {
    setSession("7", "SECURITY");
    setDatabaseUser({ id: 7, username: "it-operator", role: "IT" });

    await expect(requireRole("ADMIN", "IT")).resolves.toMatchObject({
      id: 7,
      role: "IT",
    });
  });

  it("rechaza el rol vigente aunque la sesión afirme tener otro rol", async () => {
    setSession("7", "ADMIN");
    setDatabaseUser({ id: 7, username: "security-operator", role: "SECURITY" });

    await expect(requireRole("ADMIN", "IT")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("servicios de lectura con datos administrativos", () => {
  it("rechazan SECURITY antes de consultar equipos, empleados, asignaciones o mantenimientos", async () => {
    setSession("61", "ADMIN");
    setDatabaseUser({ id: 61, username: "security-operator", role: "SECURITY" });

    const reads = [
      () => listEquipmentPaginated(),
      () => getEquipmentDetails(1),
      () => listEmployees(),
      () => getEmployeeDetails(1),
      () => getActiveAssignmentsByEmployeeId(1),
      () => listActiveAssignmentsPaginated(),
      () => listAssignmentHistoryPaginated(),
      () => getAssignmentDetails(1),
      () => listActiveAssignments(),
      () => listAssignmentHistory(),
      () => listMaintenanceHistory(),
      () => getEquipmentMaintenanceHistory(1),
      () => listEligibleMaintenanceEquipment(),
      () => readDocument("permits/example.pdf"),
      () =>
        registerMaintenanceBatch({
          maintenanceDate: "2026-10-26",
          provider: "Proveedor",
          notes: "Mantenimiento preventivo",
          equipmentIds: [1],
        }),
    ];

    for (const read of reads) {
      await expect(read()).rejects.toMatchObject({ code: "FORBIDDEN" });
    }

    expect(findUniqueMock).toHaveBeenCalledTimes(reads.length);
    expect(equipmentUpdateMock).not.toHaveBeenCalled();
    expect(equipmentCreateMock).not.toHaveBeenCalled();
    expect(employeeCreateMock).not.toHaveBeenCalled();
    expect(assignmentCreateMock).not.toHaveBeenCalled();
    expect(assignmentUpdateManyMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("rechazan una sesión ausente antes de consultar información administrativa", async () => {
    const reads = [
      () => listEquipmentPaginated(),
      () => listEmployees(),
      () => listActiveAssignmentsPaginated(),
      () => listMaintenanceHistory(),
    ];

    for (const read of reads) {
      await expect(read()).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    }

    expect(findUniqueMock).not.toHaveBeenCalled();
  });
});

describe("Route Handlers de información administrativa", () => {
  it("rechazan SECURITY antes de consultar asignaciones o entregar documentos", async () => {
    setSession("62", "ADMIN");
    setDatabaseUser({ id: 62, username: "security-operator", role: "SECURITY" });
    const context = { params: Promise.resolve({ id: "1" }) };

    const equipmentResponse = await getEmployeeEquipment(
      new Request("http://localhost/api/employees/1/equipment"),
      context,
    );
    const generatedResponse = await getGeneratedAssignmentDocument(
      new Request("http://localhost/api/documents/assignment/1/generated"),
      context,
    );
    const signedResponse = await getSignedAssignmentDocument(
      new Request("http://localhost/api/documents/assignment/1/signed"),
      context,
    );

    expect(equipmentResponse.status).toBe(403);
    expect(generatedResponse.status).toBe(403);
    expect(signedResponse.status).toBe(403);
    expect(assignmentFindUniqueMock).not.toHaveBeenCalled();
  });
});

describe("createEmployee", () => {
  it("rechaza SECURITY antes de escribir y no transforma el error en éxito", async () => {
    setSession("31", "ADMIN");
    setDatabaseUser({ id: 31, username: "security-operator", role: "SECURITY" });

    const formData = new FormData();
    formData.set("userId", "1");
    formData.set("role", "ADMIN");
    formData.set("sapNumber", "SAP-TEST");

    await expect(createEmployee(formData)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 31 } }),
    );
    expect(employeeCreateMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("servicios de escritura de asignaciones", () => {
  it("rechaza una sesión ausente antes de modificar asignaciones o inventario", async () => {
    await expect(
      createAssignment({ employeeId: 5, equipmentId: 8 }),
    ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    await expect(returnAssignment(12)).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
    await expect(cancelAssignment(12, "captura incorrecta")).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });

    expect(assignmentCreateMock).not.toHaveBeenCalled();
    expect(assignmentUpdateManyMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("rechaza SECURITY antes de cualquier escritura, incluso invocando los servicios directamente", async () => {
    setSession("42", "ADMIN");
    setDatabaseUser({ id: 42, username: "security-operator", role: "SECURITY" });

    const pdf = new File(["pdf"], "signed.pdf", { type: "application/pdf" });
    const operations = [
      () => createAssignment({ employeeId: 5, equipmentId: 8 }),
      () => returnAssignment(12),
      () => cancelAssignment(12, "captura incorrecta"),
      () => generateAssignmentDocument(12),
      () => uploadSignedPdf(12, pdf),
    ];

    for (const operation of operations) {
      await expect(operation()).rejects.toMatchObject({ code: "FORBIDDEN" });
    }

    expect(assignmentCreateMock).not.toHaveBeenCalled();
    expect(assignmentUpdateManyMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });
});

describe("Server Actions de asignaciones", () => {
  beforeEach(() => {
    setSession("43", "ADMIN");
    setDatabaseUser({ id: 43, username: "security-operator", role: "SECURITY" });
  });

  it("devuelve rechazo explícito en creación, devolución, cancelación y documentos", async () => {
    const createForm = new FormData();
    createForm.set("employeeId", "5");
    createForm.set("equipmentId", "8");

    const uploadForm = new FormData();
    uploadForm.set(
      "file",
      new File(["pdf"], "signed.pdf", { type: "application/pdf" }),
    );

    const results = await Promise.all([
      createAssignmentAction(createForm),
      returnAssignmentAction(12),
      cancelAssignmentAction(12, "captura incorrecta"),
      generateResponsivaAction(12),
      uploadSignedPdfAction(12, uploadForm),
    ]);

    expect(results).toHaveLength(5);
    for (const result of results) {
      expect(result).toEqual({
        success: false,
        message: "No tienes permisos para gestionar asignaciones.",
      });
    }
    expect(assignmentCreateMock).not.toHaveBeenCalled();
    expect(assignmentUpdateManyMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("la acción duplicada de devolución propaga la denegación y no informa éxito", async () => {
    await expect(duplicateReturnAssignmentAction(12)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(assignmentUpdateManyMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });
});

describe("updateEquipment", () => {
  it("ignora userId y role del formulario y rechaza según la cuenta de sesión", async () => {
    setSession("24", "ADMIN");
    setDatabaseUser({ id: 24, username: "security-operator", role: "SECURITY" });

    const formData = new FormData();
    formData.set("userId", "1");
    formData.set("role", "ADMIN");
    formData.set("type", "LAPTOP");
    formData.set("assetTag", "ASSET-1");

    const result = await updateEquipment(55, {}, formData);

    expect(result).toEqual({
      errors: { general: "No tienes permisos para modificar equipos." },
    });
    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 24 } }),
    );
    expect(equipmentUpdateMock).not.toHaveBeenCalled();
  });

  it("createEquipment ignora el rol enviado por cliente y niega SECURITY", async () => {
    setSession("25", "ADMIN");
    setDatabaseUser({ id: 25, username: "security-operator", role: "SECURITY" });

    const formData = new FormData();
    formData.set("userId", "1");
    formData.set("role", "ADMIN");
    formData.set("type", "LAPTOP");
    formData.set("assetTag", "ASSET-25");
    formData.set("company", "GP2");
    formData.set("status", "AVAILABLE");
    formData.set("ownership", "OWNED");

    const result = await createEquipment({}, formData);

    expect(result).toEqual({
      errors: { general: "No tienes permisos para registrar equipos." },
    });
    expect(equipmentCreateMock).not.toHaveBeenCalled();
  });
});
