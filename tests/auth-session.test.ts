import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  nextAuthOptions,
  findUniqueMock,
  verifyMock,
  transactionMock,
  writeAuditEventMock,
  transactionClient,
} = vi.hoisted(() => ({
  nextAuthOptions: { current: null as Record<string, unknown> | null },
  findUniqueMock: vi.fn(),
  verifyMock: vi.fn(),
  transactionMock: vi.fn(),
  writeAuditEventMock: vi.fn(),
  transactionClient: { auditEvent: { create: vi.fn() } },
}));

vi.mock("next-auth", () => ({
  default: (options: Record<string, unknown>) => {
    nextAuthOptions.current = options;
    return {
      handlers: {},
      signIn: vi.fn(),
      signOut: vi.fn(),
      auth: vi.fn(),
    };
  },
}));
vi.mock("next-auth/providers/credentials", () => ({
  default: (options: Record<string, unknown>) => ({
    id: "credentials",
    options,
  }),
}));
vi.mock("argon2", () => ({ default: { verify: verifyMock } }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: findUniqueMock },
    $transaction: transactionMock,
  },
}));
vi.mock("@/services/audit/service", () => ({
  writeAuditEvent: writeAuditEventMock,
}));

import "@/auth";

type AuthOptions = {
  providers: Array<{
    options: {
      authorize: (credentials: Record<string, unknown>) => Promise<unknown>;
    };
  }>;
  events: {
    signIn: (args: {
      user: { id: string; username: string; role: "ADMIN" | "IT" | "SECURITY" };
      account?: { provider: string } | null;
    }) => Promise<void>;
  };
  callbacks: {
    jwt: (args: unknown) => Promise<Record<string, unknown>>;
    session: (args: unknown) => Record<string, unknown>;
  };
};

function options() {
  return nextAuthOptions.current as unknown as AuthOptions;
}

function userRecord(isActive: boolean) {
  return {
    id: 17,
    username: "admin-test",
    passwordHash: "$argon2id$test-hash",
    firstName: "Admin",
    lastName: "Prueba",
    role: "ADMIN",
    isActive,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  findUniqueMock.mockResolvedValue(userRecord(true));
  verifyMock.mockResolvedValue(true);
  transactionMock.mockImplementation(
    async (callback: (tx: typeof transactionClient) => unknown) =>
      callback(transactionClient),
  );
  writeAuditEventMock.mockResolvedValue({ id: 1 });
});

describe("autenticación y sesión de cuentas activas", () => {
  it("permite autenticar una cuenta activa con contraseña Argon2id válida", async () => {
    const authorize = options().providers[0].options.authorize;

    await expect(
      authorize({ username: "admin-test", password: "password-test" }),
    ).resolves.toMatchObject({
      id: "17",
      username: "admin-test",
      role: "ADMIN",
    });

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { username: "admin-test" },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });
    expect(verifyMock).toHaveBeenCalledWith(
      "$argon2id$test-hash",
      "password-test",
    );
    await options().events.signIn({
      account: { provider: "credentials" },
      user: { id: "17", username: "admin-test", role: "ADMIN" },
    });

    expect(writeAuditEventMock).toHaveBeenCalledWith(transactionClient, {
      actor: { id: 17, username: "admin-test", role: "ADMIN" },
      action: "LOGIN_SUCCEEDED",
      entityType: "AUTHENTICATION",
      entityId: "17",
      outcome: "SUCCESS",
      source: "auth.credentials",
    });
    expect(JSON.stringify(writeAuditEventMock.mock.calls)).not.toContain(
      "password-test",
    );
  });

  it.each([
    ["cuenta inexistente", null],
    ["cuenta inactiva", userRecord(false)],
  ])("rechaza %s con el evento genérico de fallo", async (_case, user) => {
    findUniqueMock.mockResolvedValue(user);
    const authorize = options().providers[0].options.authorize;

    await expect(
      authorize({ username: "admin-test", password: "password-test" }),
    ).resolves.toBeNull();
    if (user === null || user.isActive === false) {
      expect(verifyMock).not.toHaveBeenCalled();
    }
    expect(writeAuditEventMock).toHaveBeenCalledWith(transactionClient, {
      actor: null,
      action: "LOGIN_FAILED",
      entityType: "AUTHENTICATION",
      entityId: "credentials",
      outcome: "FAILURE",
      source: "auth.credentials",
      after: { username: "admin-test" },
    });
    expect(transactionMock).toHaveBeenCalledOnce();
    expect(JSON.stringify(writeAuditEventMock.mock.calls)).not.toContain(
      "password-test",
    );
  });

  it("registra una contraseña incorrecta sin revelar el motivo específico", async () => {
    verifyMock.mockResolvedValue(false);
    const authorize = options().providers[0].options.authorize;

    await expect(
      authorize({ username: "admin-test", password: "wrong-password" }),
    ).resolves.toBeNull();

    expect(writeAuditEventMock).toHaveBeenCalledWith(transactionClient, {
      actor: null,
      action: "LOGIN_FAILED",
      entityType: "AUTHENTICATION",
      entityId: "credentials",
      outcome: "FAILURE",
      source: "auth.credentials",
      after: { username: "admin-test" },
    });
    expect(JSON.stringify(writeAuditEventMock.mock.calls)).not.toContain(
      "wrong-password",
    );
  });

  it("registra el inicio real solo en el evento de Auth.js y no en cada callback JWT", async () => {
    const user = { id: "17", username: "admin-test", role: "ADMIN" as const };
    await options().callbacks.jwt({ token: {}, user });
    await options().callbacks.jwt({ token: { id: "17" } });
    expect(writeAuditEventMock).not.toHaveBeenCalled();

    await options().events.signIn({
      account: { provider: "credentials" },
      user,
    });

    expect(writeAuditEventMock).toHaveBeenCalledOnce();
    expect(writeAuditEventMock).toHaveBeenCalledWith(transactionClient, {
      actor: { id: 17, username: "admin-test", role: "ADMIN" },
      action: "LOGIN_SUCCEEDED",
      entityType: "AUTHENTICATION",
      entityId: "17",
      outcome: "SUCCESS",
      source: "auth.credentials",
    });
  });

  it("ignora eventos de acceso que no proceden de Credentials", async () => {
    await options().events.signIn({
      account: { provider: "oauth" },
      user: { id: "17", username: "admin-test", role: "ADMIN" },
    });
    expect(writeAuditEventMock).not.toHaveBeenCalled();
  });

  it("no completa el inicio si falla la auditoría del evento signIn", async () => {
    const auditError = new Error("audit insert failed");
    writeAuditEventMock.mockRejectedValue(auditError);

    await expect(
      options().events.signIn({
        account: { provider: "credentials" },
        user: { id: "17", username: "admin-test", role: "ADMIN" },
      }),
    ).rejects.toBe(auditError);
  });

  it("no convierte silenciosamente en credenciales incorrectas un fallo al auditar un intento", async () => {
    findUniqueMock.mockResolvedValue(null);
    const auditError = new Error("audit insert failed");
    writeAuditEventMock.mockRejectedValue(auditError);
    const authorize = options().providers[0].options.authorize;

    await expect(
      authorize({ username: "unknown-user", password: "password-test" }),
    ).rejects.toBe(auditError);
  });

  it("elimina la identidad de un JWT existente cuando la cuenta fue desactivada", async () => {
    findUniqueMock.mockResolvedValue(userRecord(false));
    const token = {
      id: "17",
      username: "admin-test",
      role: "ADMIN",
      name: "Admin Prueba",
    };

    const updatedToken = await options().callbacks.jwt({ token });

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: 17 },
      select: { id: true, username: true, role: true, isActive: true },
    });
    expect(updatedToken).not.toHaveProperty("id");
    expect(updatedToken).not.toHaveProperty("role");
    expect(updatedToken).toHaveProperty("disabled", true);

    const session = {
      user: { name: "Admin Prueba", email: undefined, image: undefined },
      expires: "2026-10-27T00:00:00.000Z",
    };
    const resolvedSession = options().callbacks.session({
      session,
      token: updatedToken,
    });

    expect(resolvedSession).not.toHaveProperty("user.id");
    expect(resolvedSession).not.toHaveProperty("user.role");
    expect(resolvedSession).not.toHaveProperty("user.username");
  });

  it("actualiza el rol de una sesión existente desde la base de datos", async () => {
    findUniqueMock.mockResolvedValue({ ...userRecord(true), role: "IT" });

    const updatedToken = await options().callbacks.jwt({
      token: { id: "17", username: "admin-test", role: "ADMIN" },
    });

    expect(updatedToken).toMatchObject({ id: "17", role: "IT", disabled: false });
  });
});
