import { beforeEach, describe, expect, it, vi } from "vitest";

const { nextAuthOptions, findUniqueMock, verifyMock } = vi.hoisted(() => ({
  nextAuthOptions: { current: null as Record<string, unknown> | null },
  findUniqueMock: vi.fn(),
  verifyMock: vi.fn(),
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
  prisma: { user: { findUnique: findUniqueMock } },
}));

import "@/auth";

type AuthOptions = {
  providers: Array<{
    options: {
      authorize: (credentials: Record<string, unknown>) => Promise<unknown>;
    };
  }>;
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
  });

  it("rechaza el login de una cuenta inactiva sin verificar su contraseña", async () => {
    findUniqueMock.mockResolvedValue(userRecord(false));
    const authorize = options().providers[0].options.authorize;

    await expect(
      authorize({ username: "admin-test", password: "password-test" }),
    ).resolves.toBeNull();
    expect(verifyMock).not.toHaveBeenCalled();
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
