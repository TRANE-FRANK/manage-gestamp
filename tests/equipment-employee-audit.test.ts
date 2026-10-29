import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireRoleMock,
  equipmentCreateMock,
  equipmentFindUniqueMock,
  equipmentUpdateMock,
  employeeCreateMock,
  queryRawMock,
  transactionMock,
  writeAuditEventMock,
  revalidatePathMock,
  redirectMock,
} = vi.hoisted(() => ({
  requireRoleMock: vi.fn(),
  equipmentCreateMock: vi.fn(),
  equipmentFindUniqueMock: vi.fn(),
  equipmentUpdateMock: vi.fn(),
  employeeCreateMock: vi.fn(),
  queryRawMock: vi.fn(),
  transactionMock: vi.fn(),
  writeAuditEventMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", () => ({
  AccessControlError: class AccessControlError extends Error {
    constructor(public readonly code: "UNAUTHENTICATED" | "FORBIDDEN") {
      super(code);
    }
  },
  requireRole: requireRoleMock,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
  },
}));
vi.mock("@/services/audit/service", () => ({
  writeAuditEvent: writeAuditEventMock,
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import { createEmployee } from "@/actions/employee-actions";
import {
  createEquipment,
  updateEquipment,
  type EquipmentFormState,
} from "@/actions/equipment-actions";
import { AccessControlError } from "@/lib/auth/authorization";

const actor = { id: 12, username: "it.admin", role: "IT" as const };
const equipmentBefore = {
  id: 55,
  assetTag: "ASSET-55",
  barcode: "ASSET-55",
  type: "LAPTOP",
  inventoryNumber: "INV-55",
  serialNumber: "SER-55",
  brand: "Brand",
  model: "Model A",
  company: "GP2",
  status: "AVAILABLE",
  ownership: "OWNED",
  warrantyExpiresAt: new Date("2027-01-01T00:00:00.000Z"),
};
const equipmentAfter = { ...equipmentBefore, model: "Model B" };
const tx = {
  equipment: {
    create: equipmentCreateMock,
    findUnique: equipmentFindUniqueMock,
    update: equipmentUpdateMock,
  },
  employee: { create: employeeCreateMock },
  $queryRaw: queryRawMock,
};

function equipmentForm(): FormData {
  const formData = new FormData();
  formData.set("type", "LAPTOP");
  formData.set("assetTag", "ASSET-55");
  formData.set("inventoryNumber", "INV-55");
  formData.set("serialNumber", "SER-55");
  formData.set("brand", "Brand");
  formData.set("model", "Model B");
  formData.set("company", "GP2");
  formData.set("status", "AVAILABLE");
  formData.set("ownership", "OWNED");
  formData.set("warrantyExpiresAt", "2027-01-01");
  formData.set("userId", "999");
  formData.set("role", "ADMIN");
  return formData;
}

function employeeForm(): FormData {
  const formData = new FormData();
  formData.set("sapNumber", "SAP-55");
  formData.set("firstName", "Employee");
  formData.set("lastName", "Example");
  formData.set("department", "IT");
  formData.set("position", "Technician");
  formData.set("company", "GP2");
  formData.set("userId", "999");
  formData.set("role", "ADMIN");
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireRoleMock.mockResolvedValue(actor);
  equipmentCreateMock.mockResolvedValue(equipmentBefore);
  equipmentFindUniqueMock.mockResolvedValue(equipmentBefore);
  equipmentUpdateMock.mockResolvedValue(equipmentAfter);
  employeeCreateMock.mockResolvedValue({
    id: 77,
    sapNumber: "SAP-55",
    firstName: "Employee",
    lastName: "Example",
    department: "IT",
    position: "Technician",
    company: "GP2",
  });
  queryRawMock.mockResolvedValue([]);
  transactionMock.mockImplementation(
    async (callback: (transaction: typeof tx) => unknown) => callback(tx),
  );
  writeAuditEventMock.mockResolvedValue({ id: 91 });
  redirectMock.mockImplementation((destination: string) => {
    throw new Error(`redirect:${destination}`);
  });
});

describe("auditoría de altas y cambios de Equipment/Employee", () => {
  it("registra EQUIPMENT_CREATED con actor y campos permitidos en la transacción", async () => {
    await expect(createEquipment({} as EquipmentFormState, equipmentForm())).rejects.toThrow(
      "redirect:/equipment?created=true",
    );

    expect(requireRoleMock).toHaveBeenCalledWith("ADMIN", "IT");
    expect(transactionMock).toHaveBeenCalledWith(expect.any(Function));
    expect(writeAuditEventMock).toHaveBeenCalledWith(tx, {
      actor,
      action: "EQUIPMENT_CREATED",
      entityType: "EQUIPMENT",
      entityId: "55",
      outcome: "SUCCESS",
      source: "equipment.create",
      after: {
        assetTag: "ASSET-55",
        barcode: "ASSET-55",
        type: "LAPTOP",
        inventoryNumber: "INV-55",
        serialNumber: "SER-55",
        brand: "Brand",
        model: "Model A",
        company: "GP2",
        status: "AVAILABLE",
        ownership: "OWNED",
        warrantyExpiresAt: "2027-01-01T00:00:00.000Z",
      },
    });
  });

  it("registra EQUIPMENT_UPDATED con valores anteriores y posteriores seguros", async () => {
    await expect(
      updateEquipment(55, {} as EquipmentFormState, equipmentForm()),
    ).rejects.toThrow("redirect:/equipment/55?updated=true");

    expect(equipmentFindUniqueMock).toHaveBeenCalledWith({
      where: { id: 55 },
      select: expect.objectContaining({ id: true, status: true }),
    });
    expect(queryRawMock).toHaveBeenCalled();
    expect(writeAuditEventMock).toHaveBeenCalledWith(tx, {
      actor,
      action: "EQUIPMENT_UPDATED",
      entityType: "EQUIPMENT",
      entityId: "55",
      outcome: "SUCCESS",
      source: "equipment.update",
      before: {
        assetTag: "ASSET-55",
        barcode: "ASSET-55",
        type: "LAPTOP",
        inventoryNumber: "INV-55",
        serialNumber: "SER-55",
        brand: "Brand",
        model: "Model A",
        company: "GP2",
        status: "AVAILABLE",
        ownership: "OWNED",
        warrantyExpiresAt: "2027-01-01T00:00:00.000Z",
      },
      after: {
        assetTag: "ASSET-55",
        barcode: "ASSET-55",
        type: "LAPTOP",
        inventoryNumber: "INV-55",
        serialNumber: "SER-55",
        brand: "Brand",
        model: "Model B",
        company: "GP2",
        status: "AVAILABLE",
        ownership: "OWNED",
        warrantyExpiresAt: "2027-01-01T00:00:00.000Z",
      },
    });
    expect(JSON.stringify(writeAuditEventMock.mock.calls)).not.toContain("generatedPdfPath");
  });

  it("no registra un cambio de equipo cuando el snapshot anterior y posterior coincide", async () => {
    equipmentUpdateMock.mockResolvedValueOnce(equipmentBefore);

    await expect(
      updateEquipment(55, {} as EquipmentFormState, equipmentForm()),
    ).rejects.toThrow("redirect:/equipment/55?updated=true");

    expect(equipmentUpdateMock).toHaveBeenCalledOnce();
    expect(writeAuditEventMock).not.toHaveBeenCalled();
  });

  it("registra EMPLOYEE_CREATED con el actor y perfil seleccionado", async () => {
    await expect(createEmployee(employeeForm())).rejects.toThrow("redirect:/employees");

    expect(requireRoleMock).toHaveBeenCalledWith("ADMIN", "IT");
    expect(writeAuditEventMock).toHaveBeenCalledWith(tx, {
      actor,
      action: "EMPLOYEE_CREATED",
      entityType: "EMPLOYEE",
      entityId: "77",
      outcome: "SUCCESS",
      source: "employees.create",
      after: {
        sapNumber: "SAP-55",
        firstName: "Employee",
        lastName: "Example",
        department: "IT",
        position: "Technician",
        company: "GP2",
      },
    });
  });

  it("rechaza sin permiso antes de iniciar transacciones o escribir eventos", async () => {
    requireRoleMock.mockRejectedValue(new AccessControlError("FORBIDDEN"));

    const result = await createEquipment({} as EquipmentFormState, equipmentForm());
    expect(result.errors?.general).toBe("No tienes permisos para registrar equipos.");
    expect(await updateEquipment(55, {} as EquipmentFormState, equipmentForm())).toMatchObject({
      errors: { general: "No tienes permisos para modificar equipos." },
    });
    await expect(createEmployee(employeeForm())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    expect(transactionMock).not.toHaveBeenCalled();
    expect(writeAuditEventMock).not.toHaveBeenCalled();
    expect(equipmentCreateMock).not.toHaveBeenCalled();
    expect(employeeCreateMock).not.toHaveBeenCalled();
  });

  it("no permite que identidad o rol enviados en formularios alteren al actor", async () => {
    await expect(createEmployee(employeeForm())).rejects.toThrow(
      "redirect:/employees",
    );

    expect(requireRoleMock).toHaveBeenCalledWith("ADMIN", "IT");
    expect(writeAuditEventMock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ actor }),
    );
    expect(writeAuditEventMock.mock.calls[0][1].actor).not.toMatchObject({
      id: 999,
      role: "ADMIN",
    });
    expect(employeeCreateMock.mock.calls[0][0]).not.toHaveProperty("data.userId");
    expect(employeeCreateMock.mock.calls[0][0]).not.toHaveProperty("data.role");
  });

  it("no reporta éxito de equipo ni empleado si falla la auditoría", async () => {
    writeAuditEventMock.mockRejectedValue(new Error("audit insert failed"));

    const equipmentResult = await createEquipment(
      {} as EquipmentFormState,
      equipmentForm(),
    );
    expect(equipmentResult.errors?.general).toContain("error inesperado");
    expect(redirectMock).not.toHaveBeenCalled();

    const updateResult = await updateEquipment(
      55,
      {} as EquipmentFormState,
      equipmentForm(),
    );
    expect(updateResult.errors?.general).toContain("error inesperado");
    expect(redirectMock).not.toHaveBeenCalled();

    await expect(createEmployee(employeeForm())).rejects.toThrow(
      "audit insert failed",
    );
    expect(transactionMock).toHaveBeenCalledTimes(3);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
