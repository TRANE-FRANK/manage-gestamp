import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInMock, redirectMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  signIn: signInMock,
  signOut: vi.fn(),
}));
vi.mock("next-auth", () => ({
  AuthError: class AuthError extends Error {
    type = "CredentialsSignin";
  },
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import { loginAction } from "@/app/login/actions";

function loginFormData(callbackUrl = "/permits") {
  const formData = new FormData();
  formData.set("username", "first-admin");
  formData.set("password", "test-password-not-real");
  formData.set("callbackUrl", callbackUrl);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  redirectMock.mockImplementation((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  });
});

describe("loginAction", () => {
  it("crea la sesión y redirige al callbackUrl permitido", async () => {
    signInMock.mockResolvedValue("http://localhost/permits");

    await expect(loginAction({ error: null }, loginFormData())).rejects.toThrow(
      "REDIRECT:/permits",
    );

    expect(signInMock).toHaveBeenCalledWith("credentials", {
      username: "first-admin",
      password: "test-password-not-real",
      redirect: false,
      redirectTo: "/permits",
    });
    expect(redirectMock).toHaveBeenCalledWith("/permits");
  });

  it("devuelve un error visible cuando Auth.js rechaza las credenciales", async () => {
    signInMock.mockResolvedValue(
      "http://localhost/login?callbackUrl=%2Fpermits&error=CredentialsSignin&code=credentials",
    );

    await expect(loginAction({ error: null }, loginFormData())).resolves.toEqual({
      error: "Usuario o contraseña incorrectos.",
    });

    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("no acepta un callbackUrl externo", async () => {
    signInMock.mockResolvedValue("http://localhost/");

    await expect(
      loginAction(
        { error: null },
        loginFormData("https://example.invalid/"),
      ),
    ).rejects.toThrow("REDIRECT:/");

    expect(signInMock).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ redirectTo: "/" }),
    );
  });
});
