"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";

export type LoginState = {
  error: string | null;
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    await signIn("credentials", formData, { redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError && error.type === "CredentialsSignin") {
      return { error: "Usuario o contraseña incorrectos." };
    }
    throw error;
  }

  return { error: null };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
