import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireRoleMock,
  findManyMock,
  countMock,
  findUniqueMock,
  createMock,
  updateMock,
  transactionMock,
  queryRawMock,
  hashMock,
  writeAuditEventMock,
} = vi.hoisted(() => ({
  requireRoleMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
  findUniqueMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  transactionMock: vi.fn(),
  queryRawMock: vi.fn(),
  hashMock: vi.fn(),
  writeAuditEventMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/authorization", () => ({ requireRole: requireRoleMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: findManyMock,
      count: countMock,
      findUnique: findUniqueMock,
      create: createMock,
      update: updateMock,
    },
    $transaction: transactionMock,
  },
}));
vi.mock("argon2", () => ({ default: { hash: hashMock, argon2id: 2 } }));
vi.mock("@/services/audit/service", () => ({
  writeAuditEvent: writeAuditEventMock,
}));

import {
  changeUserPassword,
  createUser,
  listUsers,
  setUserActive,
  updateUserProfile,
} from "@/services/user";
import {
  BusinessError,
  ConflictError,
  ValidationError,
} from "@/services/shared/errors";

const admin = { id: 1, username: "admin", role: "ADMIN" as const };
const activeAdmin = {
  id: 1,
  username: "admin",
  firstName: "Admin",
  lastName: null,
  role: "ADMIN" as const,
  isActive: true,
};
const publicUser = {
  id: 2,
  username: "it-user",
  firstName: "IT",
  lastName: null,
  role: "IT",
  isActive: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};
const tx = {
  user: {
    findUnique: findUniqueMock,
    create: createMock,
    count: countMock,
    update: updateMock,
  },
  $queryRawUnsafe: queryRawMock,
};

function validCreateInput() {
  return {
    username: "new.user",
    firstName: "Nuevo",
    lastName: "Usuario",
    password: "long-test-password",
    role: "IT" as const,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  requireRoleMock.mockResolvedValue(admin);
  findManyMock.mockResolvedValue([publicUser]);
  countMock.mockResolvedValue(1);
  findUniqueMock.mockResolvedValue(activeAdmin);
  createMock.mockResolvedValue(publicUser);
  updateMock.mockResolvedValue(publicUser);
  queryRawMock.mockResolvedValue([]);
  transactionMock.mockImplementation(
    async (callback: (transaction: typeof tx) => unknown) => callback(tx),
  );
  hashMock.mockResolvedValue("$argon2id$mock-hash");
  writeAuditEventMock.mockResolvedValue({ id: 90 });
});

describe("servicio protegido de administración de usuarios", () => {
  it("exige ADMIN antes de consultar o escribir en todas las operaciones", async () => {
    requireRoleMock.mockRejectedValue(new Error("forbidden"));
    const operations = [
      () => listUsers(),
      () => createUser(validCreateInput()),
      () => updateUserProfile({ userId: 2, firstName: "Nombre", role: "IT" }),
      () => changeUserPassword(2, "long-test-password"),
      () => setUserActive(2, false),
    ];

    for (const operation of operations) {
      await expect(operation()).rejects.toThrow("forbidden");
    }

    expect(requireRoleMock).toHaveBeenCalledTimes(operations.length);
    expect(requireRoleMock).toHaveBeenCalledWith("ADMIN");
    expect(findManyMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("busca y pagina con filtros coincidentes en resultados y conteo", async () => {
    countMock.mockResolvedValue(15);
    const result = await listUsers({ page: 3, pageSize: 10, search: " ana " });

    expect(result).toMatchObject({ page: 2, pageSize: 10, total: 15, totalPages: 2 });
    expect(countMock).toHaveBeenCalledWith({
      where: {
        OR: [
          { username: { contains: "ana", mode: "insensitive" } },
          { firstName: { contains: "ana", mode: "insensitive" } },
          { lastName: { contains: "ana", mode: "insensitive" } },
        ],
      },
    });
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: countMock.mock.calls[0][0].where,
        skip: 10,
        take: 10,
        select: expect.not.objectContaining({ passwordHash: true }),
      }),
    );
    expect(JSON.stringify(result)).not.toContain("passwordHash");
  });

  it("valida rol, usuario y límites de contraseña antes de hashear o escribir", async () => {
    await expect(
      createUser({ ...validCreateInput(), password: "short" }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      createUser({ ...validCreateInput(), role: "OWNER" as never }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      createUser({ ...validCreateInput(), username: "bad name" }),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(hashMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("crea usuarios con Argon2id y no devuelve el hash", async () => {
    const result = await createUser(validCreateInput());

    expect(hashMock).toHaveBeenCalledWith("long-test-password", { type: 2 });
    expect(createMock).toHaveBeenCalledWith({
      data: {
        username: "new.user",
        firstName: "Nuevo",
        lastName: "Usuario",
        passwordHash: "$argon2id$mock-hash",
        role: "IT",
        isActive: true,
      },
      select: expect.not.objectContaining({ passwordHash: true }),
    });
    expect(result).not.toHaveProperty("passwordHash");
    expect(writeAuditEventMock).toHaveBeenCalledWith(tx, {
      actor: admin,
      action: "USER_CREATED",
      entityType: "USER",
      entityId: String(publicUser.id),
      outcome: "SUCCESS",
      source: "users.create",
      after: {
        username: publicUser.username,
        firstName: publicUser.firstName,
        lastName: publicUser.lastName,
        role: publicUser.role,
        isActive: publicUser.isActive,
      },
    });
    expect(JSON.stringify(writeAuditEventMock.mock.calls)).not.toContain("passwordHash");
    expect(JSON.stringify(writeAuditEventMock.mock.calls)).not.toContain("$argon2id$");
  });

  it("rechaza el alta si falla la inserción de auditoría dentro de la transacción", async () => {
    const auditFailure = new Error("audit insert failed");
    writeAuditEventMock.mockRejectedValueOnce(auditFailure);

    await expect(createUser(validCreateInput())).rejects.toBe(auditFailure);

    expect(transactionMock).toHaveBeenCalledWith(expect.any(Function));
    expect(createMock).toHaveBeenCalled();
    expect(writeAuditEventMock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ action: "USER_CREATED" }),
    );
  });

  it("el mock transaccional no confirma cambios si falla la auditoría", async () => {
    const originalUser = {
      id: 2,
      username: "it-user",
      firstName: "Nombre anterior",
      lastName: null,
      role: "IT" as const,
      isActive: true,
    };
    let committedUser = { ...originalUser };
    let draftUser = { ...originalUser };
    const transactionClient = {
      $queryRawUnsafe: vi.fn(async () => []),
      user: {
        findUnique: vi.fn(async () => ({ ...draftUser })),
        count: vi.fn(async () => 1),
        update: vi.fn(async ({ data }: { data: Partial<typeof draftUser> }) => {
          draftUser = { ...draftUser, ...data };
          return { ...draftUser };
        }),
      },
    };
    transactionMock.mockImplementation(
      async (callback: (transaction: typeof transactionClient) => unknown) => {
        draftUser = { ...committedUser };
        try {
          const result = await callback(transactionClient);
          committedUser = { ...draftUser };
          return result;
        } catch (error) {
          throw error;
        }
      },
    );
    writeAuditEventMock.mockRejectedValueOnce(new Error("audit insert failed"));

    await expect(
      updateUserProfile({ userId: 2, firstName: "Nombre nuevo", role: "IT" }),
    ).rejects.toThrow("audit insert failed");

    expect(committedUser).toEqual(originalUser);
    expect(writeAuditEventMock).toHaveBeenCalledWith(
      transactionClient,
      expect.objectContaining({ action: "USER_PROFILE_UPDATED" }),
    );
  });

  it("mapea username duplicado a un conflicto comprensible", async () => {
    createMock.mockRejectedValue(
      Object.assign(new Error("duplicate"), { code: "P2002" }),
    );
    await expect(createUser(validCreateInput())).rejects.toBeInstanceOf(ConflictError);
  });

  it("modifica perfil y rol bajo el bloqueo asesor transaccional", async () => {
    findUniqueMock.mockResolvedValue({
      id: 2,
      username: "it-user",
      firstName: "IT",
      lastName: null,
      role: "IT",
      isActive: true,
    });
    await updateUserProfile({
      userId: 2,
      firstName: "Nombre nuevo",
      lastName: "Apellido",
      role: "SECURITY",
    });

    expect(transactionMock).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: "ReadCommitted" },
    );
    expect(queryRawMock).toHaveBeenCalledWith(
      "SELECT pg_advisory_xact_lock(1296649044, 1)",
    );
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 2 },
        data: { firstName: "Nombre nuevo", lastName: "Apellido", role: "SECURITY" },
      }),
    );
    expect(writeAuditEventMock).toHaveBeenCalledTimes(2);
    expect(writeAuditEventMock).toHaveBeenNthCalledWith(1, tx, {
      actor: admin,
      action: "USER_PROFILE_UPDATED",
      entityType: "USER",
      entityId: "2",
      outcome: "SUCCESS",
      source: "users.update-profile",
      before: { firstName: "IT", lastName: null },
      after: { firstName: "Nombre nuevo", lastName: "Apellido" },
    });
    expect(writeAuditEventMock).toHaveBeenNthCalledWith(2, tx, {
      actor: admin,
      action: "USER_ROLE_CHANGED",
      entityType: "USER",
      entityId: "2",
      outcome: "SUCCESS",
      source: "users.update-profile",
      before: { role: "IT" },
      after: { role: "SECURITY" },
    });
  });

  it("actualiza contraseña con Argon2id y no devuelve el hash", async () => {
    findUniqueMock.mockResolvedValue({ id: 2 });
    await expect(
      changeUserPassword(2, "another-long-password"),
    ).resolves.toBeUndefined();

    expect(hashMock).toHaveBeenCalledWith("another-long-password", { type: 2 });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { passwordHash: "$argon2id$mock-hash" },
      select: { id: true },
    });
    expect(writeAuditEventMock).toHaveBeenCalledWith(tx, {
      actor: admin,
      action: "USER_PASSWORD_CHANGED",
      entityType: "USER",
      entityId: "2",
      outcome: "SUCCESS",
      source: "users.change-password",
    });
    const passwordAuditInput = writeAuditEventMock.mock.calls[0][1];
    expect(passwordAuditInput).not.toHaveProperty("before");
    expect(passwordAuditInput).not.toHaveProperty("after");
    expect(JSON.stringify(passwordAuditInput)).not.toContain("$argon2id$");
  });

  it("activa o desactiva sin borrar el usuario", async () => {
    findUniqueMock.mockResolvedValue({
      id: 2,
      username: "it-user",
      firstName: "IT",
      lastName: null,
      role: "IT",
      isActive: true,
    });
    await setUserActive(2, false);

    expect(queryRawMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 2 },
        data: { isActive: false },
      }),
    );
    expect(writeAuditEventMock).toHaveBeenCalledWith(tx, {
      actor: admin,
      action: "USER_DEACTIVATED",
      entityType: "USER",
      entityId: "2",
      outcome: "SUCCESS",
      source: "users.set-active",
      before: { isActive: true },
      after: { isActive: false },
    });
  });

  it("registra USER_ACTIVATED al reactivar una cuenta", async () => {
    findUniqueMock.mockResolvedValue({
      id: 2,
      username: "it-user",
      firstName: "IT",
      lastName: null,
      role: "IT",
      isActive: false,
    });

    await setUserActive(2, true);

    expect(writeAuditEventMock).toHaveBeenCalledWith(tx, {
      actor: admin,
      action: "USER_ACTIVATED",
      entityType: "USER",
      entityId: "2",
      outcome: "SUCCESS",
      source: "users.set-active",
      before: { isActive: false },
      after: { isActive: true },
    });
  });

  it("bloquea degradar o desactivar al último ADMIN, incluso su propia cuenta", async () => {
    requireRoleMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue(activeAdmin);
    countMock.mockResolvedValue(1);

    await expect(
      updateUserProfile({ userId: 1, firstName: "Admin", role: "IT" }),
    ).rejects.toBeInstanceOf(BusinessError);
    await expect(setUserActive(1, false)).rejects.toBeInstanceOf(BusinessError);

    expect(transactionMock).toHaveBeenCalledTimes(2);
    expect(queryRawMock).toHaveBeenCalledTimes(2);
    expect(updateMock).not.toHaveBeenCalled();
    expect(writeAuditEventMock).not.toHaveBeenCalled();
  });

  it("conserva el comportamiento de permitir cambios propios si queda otro ADMIN activo", async () => {
    findUniqueMock.mockResolvedValue(activeAdmin);
    countMock.mockResolvedValue(2);

    await expect(
      updateUserProfile({ userId: 1, firstName: "Admin", role: "IT" }),
    ).resolves.toBeDefined();
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 }, data: expect.objectContaining({ role: "IT" }) }),
    );
    expect(writeAuditEventMock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ action: "USER_ROLE_CHANGED", entityId: "1" }),
    );

    vi.clearAllMocks();
    requireRoleMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue(activeAdmin);
    countMock.mockResolvedValue(2);
    transactionMock.mockImplementation(
      async (callback: (transaction: typeof tx) => unknown) => callback(tx),
    );
    writeAuditEventMock.mockResolvedValue({ id: 91 });

    await expect(setUserActive(1, false)).resolves.toBeDefined();
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 }, data: { isActive: false } }),
    );
    expect(writeAuditEventMock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ action: "USER_DEACTIVATED", entityId: "1" }),
    );
  });

  it("mantiene un ADMIN ante dos desactivaciones concurrentes simuladas", async () => {
    const users = new Map<number, { id: number; role: "ADMIN"; isActive: boolean }>([
      [1, { id: 1, role: "ADMIN", isActive: true }],
      [2, { id: 2, role: "ADMIN", isActive: true }],
    ]);
    const serializedTx = {
      $queryRawUnsafe: vi.fn(async () => []),
      user: {
        findUnique: vi.fn(async ({ where }: { where: { id: number } }) => users.get(where.id) ?? null),
        count: vi.fn(async () => [...users.values()].filter((user) => user.role === "ADMIN" && user.isActive).length),
        update: vi.fn(async ({ where, data }: { where: { id: number }; data: { isActive: boolean } }) => {
          const updated = { ...users.get(where.id)!, ...data };
          users.set(where.id, updated);
          return updated;
        }),
      },
    };
    let transactionTail = Promise.resolve();
    transactionMock.mockImplementation((callback: (transaction: typeof serializedTx) => unknown) => {
      const current = transactionTail.then(() => callback(serializedTx));
      transactionTail = current.then(() => undefined, () => undefined);
      return current;
    });

    const results = await Promise.allSettled([
      setUserActive(1, false),
      setUserActive(2, false),
    ]);
    const activeAdmins = [...users.values()].filter(
      (user) => user.role === "ADMIN" && user.isActive,
    );

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(activeAdmins).toHaveLength(1);
    expect(serializedTx.$queryRawUnsafe).toHaveBeenCalledTimes(2);
  });
});
