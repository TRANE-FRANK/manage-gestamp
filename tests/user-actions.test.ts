import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireRoleMock,
  createUserMock,
  updateUserProfileMock,
  changeUserPasswordMock,
  setUserActiveMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  requireRoleMock: vi.fn(),
  createUserMock: vi.fn(),
  updateUserProfileMock: vi.fn(),
  changeUserPasswordMock: vi.fn(),
  setUserActiveMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", () => ({
  AccessControlError: class AccessControlError extends Error {
    constructor(public readonly code: "UNAUTHENTICATED" | "FORBIDDEN") {
      super(code);
    }
  },
  requireRole: requireRoleMock,
}));
vi.mock("@/services/user", () => ({
  createUser: createUserMock,
  updateUserProfile: updateUserProfileMock,
  changeUserPassword: changeUserPasswordMock,
  setUserActive: setUserActiveMock,
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/generated/prisma/client", () => ({
  UserRole: { ADMIN: "ADMIN", IT: "IT", SECURITY: "SECURITY" },
}));

import {
  changeUserPasswordAction,
  createUserAction,
  setUserActiveAction,
  updateUserProfileAction,
} from "@/actions/user-actions";
import { AccessControlError } from "@/lib/auth/authorization";
import { BusinessError } from "@/services/shared/errors";

function formData(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireRoleMock.mockResolvedValue({ id: 1, role: "ADMIN" });
  createUserMock.mockResolvedValue({ id: 2, username: "new-user" });
  updateUserProfileMock.mockResolvedValue({ id: 2 });
  changeUserPasswordMock.mockResolvedValue(undefined);
  setUserActiveMock.mockResolvedValue({ id: 2, isActive: false });
});

describe("Server Actions de administración de usuarios", () => {
  it("exige ADMIN antes de delegar al servicio", async () => {
    requireRoleMock.mockRejectedValue(new AccessControlError("FORBIDDEN"));
    const results = await Promise.all([
      createUserAction({}, formData({})),
      updateUserProfileAction({}, formData({})),
      changeUserPasswordAction({}, formData({})),
      setUserActiveAction(2, false),
    ]);

    expect(results).toEqual(
      results.map(() => ({
        success: false,
        message: "No tienes permisos para administrar usuarios.",
      })),
    );
    expect(requireRoleMock).toHaveBeenCalledTimes(4);
    expect(requireRoleMock).toHaveBeenCalledWith("ADMIN");
    expect(createUserMock).not.toHaveBeenCalled();
    expect(updateUserProfileMock).not.toHaveBeenCalled();
    expect(changeUserPasswordMock).not.toHaveBeenCalled();
    expect(setUserActiveMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("presenta una denegación de sesión como mensaje comprensible", async () => {
    requireRoleMock.mockRejectedValue(new AccessControlError("UNAUTHENTICATED"));

    await expect(createUserAction({}, formData({}))).resolves.toEqual({
      success: false,
      message: "Inicia sesión para administrar usuarios.",
    });
    expect(createUserMock).not.toHaveBeenCalled();
  });

  it("crea la cuenta delegando la validación y devuelve un resultado serializable", async () => {
    const result = await createUserAction(
      {},
      formData({
        username: "new-user",
        firstName: "Nuevo",
        lastName: "",
        password: "long-test-password",
        role: "IT",
      }),
    );

    expect(createUserMock).toHaveBeenCalledWith({
      username: "new-user",
      firstName: "Nuevo",
      lastName: "",
      password: "long-test-password",
      role: "IT",
    });
    expect(result).toEqual({
      success: true,
      message: "La cuenta se creó correctamente.",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/users");
  });

  it("preserva errores de negocio del servicio sin convertirlos en éxito", async () => {
    createUserMock.mockRejectedValue(
      new BusinessError("Ese nombre de usuario ya está registrado.", 409),
    );

    await expect(
      createUserAction({}, formData({ username: "existing" })),
    ).resolves.toEqual({
      success: false,
      message: "Ese nombre de usuario ya está registrado.",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("no cambia la contraseña cuando la confirmación no coincide", async () => {
    const result = await changeUserPasswordAction(
      {},
      formData({
        userId: "2",
        password: "long-test-password",
        confirmPassword: "different-long-password",
      }),
    );

    expect(result).toEqual({
      success: false,
      message: "Las contraseñas no coinciden.",
    });
    expect(changeUserPasswordMock).not.toHaveBeenCalled();
  });

  it("puede invocar la acción de cambio de estado y revalidar la lista", async () => {
    await expect(setUserActiveAction(2, true)).resolves.toEqual({
      success: true,
      message: "La cuenta se activó correctamente.",
    });
    expect(setUserActiveMock).toHaveBeenCalledWith(2, true);
    expect(revalidatePathMock).toHaveBeenCalledWith("/users");
  });
});
