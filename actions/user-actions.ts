"use server";

import { revalidatePath } from "next/cache";

import { requireRole, AccessControlError } from "@/lib/auth/authorization";
import {
  changeUserPassword,
  createUser,
  setUserActive,
  updateUserProfile,
} from "@/services/user";
import { BusinessError } from "@/services/shared/errors";
import type { UserRole } from "@/generated/prisma/client";

export type UserManagementActionState = {
  success?: boolean;
  message?: string;
};

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function actionError(error: unknown): string {
  if (error instanceof AccessControlError) {
    return error.code === "UNAUTHENTICATED"
      ? "Inicia sesión para administrar usuarios."
      : "No tienes permisos para administrar usuarios.";
  }
  if (error instanceof BusinessError) return error.message;
  return "No fue posible completar la operación. Inténtalo de nuevo.";
}

export async function createUserAction(
  _previousState: UserManagementActionState,
  formData: FormData,
): Promise<UserManagementActionState> {
  try {
    await requireRole("ADMIN");
    await createUser({
      username: readString(formData, "username"),
      firstName: readString(formData, "firstName"),
      lastName: readString(formData, "lastName"),
      password: readString(formData, "password"),
      role: readString(formData, "role") as UserRole,
    });
    revalidatePath("/users");
    return { success: true, message: "La cuenta se creó correctamente." };
  } catch (error) {
    return { success: false, message: actionError(error) };
  }
}

export async function updateUserProfileAction(
  _previousState: UserManagementActionState,
  formData: FormData,
): Promise<UserManagementActionState> {
  try {
    await requireRole("ADMIN");
    await updateUserProfile({
      userId: Number(readString(formData, "userId")),
      firstName: readString(formData, "firstName"),
      lastName: readString(formData, "lastName"),
      role: readString(formData, "role") as UserRole,
    });
    revalidatePath("/users");
    return { success: true, message: "Los datos de la cuenta se actualizaron." };
  } catch (error) {
    return { success: false, message: actionError(error) };
  }
}

export async function changeUserPasswordAction(
  _previousState: UserManagementActionState,
  formData: FormData,
): Promise<UserManagementActionState> {
  try {
    await requireRole("ADMIN");
    const password = readString(formData, "password");
    if (password !== readString(formData, "confirmPassword")) {
      return { success: false, message: "Las contraseñas no coinciden." };
    }
    await changeUserPassword(Number(readString(formData, "userId")), password);
    revalidatePath("/users");
    return { success: true, message: "La contraseña se cambió correctamente." };
  } catch (error) {
    return { success: false, message: actionError(error) };
  }
}

export async function setUserActiveAction(
  userId: number,
  isActive: boolean,
): Promise<UserManagementActionState> {
  try {
    await requireRole("ADMIN");
    await setUserActive(userId, isActive);
    revalidatePath("/users");
    return {
      success: true,
      message: isActive
        ? "La cuenta se activó correctamente."
        : "La cuenta se desactivó correctamente.",
    };
  } catch (error) {
    return { success: false, message: actionError(error) };
  }
}
