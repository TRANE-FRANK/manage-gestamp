"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/auth";
import { sanitizeCallbackUrl } from "@/lib/auth/page-policy";

export type LoginState = {
  error: string | null;
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = formData.get("username");
  const password = formData.get("password");
  if (typeof username !== "string" || typeof password !== "string") {
    return { error: "Ingresa tu usuario y contraseña." };
  }

  const callbackUrl = sanitizeCallbackUrl(formData.get("callbackUrl"));
  let result: unknown;

  try {
    result = await signIn("credentials", {
      username,
      password,
      redirect: false,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError && error.type === "CredentialsSignin") {
      return { error: "Usuario o contraseña incorrectos." };
    }
    throw error;
  }

  if (typeof result !== "string") {
    return { error: "No fue posible iniciar sesión. Inténtalo de nuevo." };
  }

  let destination: URL;
  try {
    destination = new URL(result, "http://manage-gestamp.invalid");
  } catch {
    return { error: "No fue posible iniciar sesión. Inténtalo de nuevo." };
  }

  if (destination.searchParams.get("error") === "CredentialsSignin") {
    return { error: "Usuario o contraseña incorrectos." };
  }

  if (destination.searchParams.has("error")) {
    return { error: "No fue posible iniciar sesión. Inténtalo de nuevo." };
  }

  const internalDestination = sanitizeCallbackUrl(
    `${destination.pathname}${destination.search}${destination.hash}`,
  );
  redirect(internalDestination);
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
