import "server-only";

import argon2 from "argon2";

import type { Prisma, UserRole as UserRoleType } from "@/generated/prisma/client";
import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/authorization";
import { writeAuditEvent } from "@/services/audit/service";
import {
  BusinessError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/services/shared/errors";

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,64}$/;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const ADMIN_LOCK_NAMESPACE = 1296649044;

const userSelect = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type ManagedUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

export type CreateUserInput = {
  username: string;
  firstName: string;
  lastName?: string | null;
  password: string;
  role: UserRoleType;
};

export type UpdateUserProfileInput = {
  userId: number;
  firstName: string;
  lastName?: string | null;
  role: UserRoleType;
};

function parseUserId(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    throw new ValidationError("La cuenta seleccionada no es válida.");
  }
  return value;
}

function parseName(value: unknown, label: string, required: boolean): string | null {
  if (value === null || value === undefined) {
    if (required) throw new ValidationError(label + " es obligatorio.");
    return null;
  }
  if (typeof value !== "string") {
    throw new ValidationError(label + " no es válido.");
  }
  const name = value.trim();
  if (!name && required) throw new ValidationError(label + " es obligatorio.");
  if (name.length > 100) {
    throw new ValidationError(label + " no puede superar 100 caracteres.");
  }
  return name || null;
}

function parseUsername(value: unknown): string {
  if (typeof value !== "string") {
    throw new ValidationError("El nombre de usuario no es válido.");
  }
  const username = value.trim();
  if (!USERNAME_PATTERN.test(username)) {
    throw new ValidationError(
      "El usuario debe tener entre 3 y 64 caracteres: letras, números, punto, guion o guion bajo.",
    );
  }
  return username;
}

function parsePassword(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length < PASSWORD_MIN_LENGTH ||
    value.length > PASSWORD_MAX_LENGTH
  ) {
    throw new ValidationError(
      "La contraseña debe tener entre " +
        PASSWORD_MIN_LENGTH +
        " y " +
        PASSWORD_MAX_LENGTH +
        " caracteres.",
    );
  }
  return value;
}

function parseRole(value: unknown): UserRoleType {
  if (
    value !== UserRole.ADMIN &&
    value !== UserRole.IT &&
    value !== UserRole.SECURITY
  ) {
    throw new ValidationError("El rol seleccionado no es válido.");
  }
  return value;
}

function parsePage(value: unknown, fallback: number, maximum: number): number {
  if (value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    throw new ValidationError("La paginación solicitada no es válida.");
  }
  return Math.min(value, maximum);
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

async function acquireAdminMutationLock(tx: Prisma.TransactionClient) {
  // Static SQL: this transaction-scoped advisory lock serializes mutations
  // that can remove the last active administrator.
  await tx.$queryRawUnsafe(
    "SELECT pg_advisory_xact_lock(" + ADMIN_LOCK_NAMESPACE + ", 1)",
  );
}

async function requireExistingUser(tx: Prisma.TransactionClient, userId: number) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  });
  if (!user) throw new NotFoundError("La cuenta seleccionada no existe.");
  return user;
}

async function ensureAnotherActiveAdminRemains(
  tx: Prisma.TransactionClient,
  user: { id: number; role: UserRoleType; isActive: boolean },
  nextRole: UserRoleType,
  nextIsActive: boolean,
) {
  const isLosingAdmin =
    user.role === UserRole.ADMIN &&
    user.isActive &&
    (nextRole !== UserRole.ADMIN || !nextIsActive);
  if (!isLosingAdmin) return;

  const activeAdminCount = await tx.user.count({
    where: { role: UserRole.ADMIN, isActive: true },
  });
  if (activeAdminCount <= 1) {
    throw new BusinessError(
      "No se puede desactivar o degradar al último administrador activo.",
    );
  }
}

export async function listUsers({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
} = {}) {
  await requireRole("ADMIN");

  const currentPage = parsePage(page, 1, Number.MAX_SAFE_INTEGER);
  const currentPageSize = parsePage(pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  if (typeof search !== "undefined" && typeof search !== "string") {
    throw new ValidationError("El texto de búsqueda no es válido.");
  }
  const searchTerm = search?.trim().slice(0, 100);
  const where: Prisma.UserWhereInput = searchTerm
    ? {
        OR: [
          { username: { contains: searchTerm, mode: "insensitive" } },
          { firstName: { contains: searchTerm, mode: "insensitive" } },
          { lastName: { contains: searchTerm, mode: "insensitive" } },
        ],
      }
    : {};

  const total = await prisma.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / currentPageSize));
  const safePage = Math.min(currentPage, totalPages);
  const data = await prisma.user.findMany({
    where,
    select: userSelect,
    orderBy: [{ username: "asc" }, { id: "asc" }],
    skip: (safePage - 1) * currentPageSize,
    take: currentPageSize,
  });

  return { data, page: safePage, pageSize: currentPageSize, total, totalPages };
}

export async function createUser(input: CreateUserInput) {
  const actor = await requireRole("ADMIN");
  if (!input || typeof input !== "object") {
    throw new ValidationError("Los datos de la cuenta no son válidos.");
  }

  const username = parseUsername(input.username);
  const firstName = parseName(input.firstName, "El nombre", true);
  const lastName = parseName(input.lastName, "El apellido", false);
  const password = parsePassword(input.password);
  const role = parseRole(input.role);
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  try {
    return await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          username,
          firstName,
          lastName,
          passwordHash,
          role,
          isActive: true,
        },
        select: userSelect,
      });

      await writeAuditEvent(tx, {
        actor,
        action: "USER_CREATED",
        entityType: "USER",
        entityId: String(createdUser.id),
        outcome: "SUCCESS",
        source: "users.create",
        after: {
          username: createdUser.username,
          firstName: createdUser.firstName,
          lastName: createdUser.lastName,
          role: createdUser.role,
          isActive: createdUser.isActive,
        },
      });

      return createdUser;
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ConflictError("Ese nombre de usuario ya está registrado.");
    }
    throw error;
  }
}

export async function updateUserProfile(input: UpdateUserProfileInput) {
  const actor = await requireRole("ADMIN");
  if (!input || typeof input !== "object") {
    throw new ValidationError("Los datos de la cuenta no son válidos.");
  }

  const userId = parseUserId(input.userId);
  const firstName = parseName(input.firstName, "El nombre", true);
  const lastName = parseName(input.lastName, "El apellido", false);
  const role = parseRole(input.role);

  return prisma.$transaction(
    async (tx) => {
      await acquireAdminMutationLock(tx);
      const currentUser = await requireExistingUser(tx, userId);
      await ensureAnotherActiveAdminRemains(
        tx,
        currentUser,
        role,
        currentUser.isActive,
      );
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { firstName, lastName, role },
        select: userSelect,
      });

      if (
        currentUser.firstName !== firstName ||
        currentUser.lastName !== lastName
      ) {
        await writeAuditEvent(tx, {
          actor,
          action: "USER_PROFILE_UPDATED",
          entityType: "USER",
          entityId: String(userId),
          outcome: "SUCCESS",
          source: "users.update-profile",
          before: {
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
          },
          after: { firstName, lastName },
        });
      }

      if (currentUser.role !== role) {
        await writeAuditEvent(tx, {
          actor,
          action: "USER_ROLE_CHANGED",
          entityType: "USER",
          entityId: String(userId),
          outcome: "SUCCESS",
          source: "users.update-profile",
          before: { role: currentUser.role },
          after: { role },
        });
      }

      return updatedUser;
    },
    { isolationLevel: "ReadCommitted" },
  );
}

export async function changeUserPassword(
  userIdInput: unknown,
  passwordInput: unknown,
) {
  const actor = await requireRole("ADMIN");
  const userId = parseUserId(userIdInput);
  const password = parsePassword(passwordInput);
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundError("La cuenta seleccionada no existe.");

    await tx.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: { id: true },
    });

    await writeAuditEvent(tx, {
      actor,
      action: "USER_PASSWORD_CHANGED",
      entityType: "USER",
      entityId: String(userId),
      outcome: "SUCCESS",
      source: "users.change-password",
    });
  });
}

export async function setUserActive(userIdInput: unknown, isActiveInput: unknown) {
  const actor = await requireRole("ADMIN");
  const userId = parseUserId(userIdInput);
  if (typeof isActiveInput !== "boolean") {
    throw new ValidationError("El estado de la cuenta no es válido.");
  }

  return prisma.$transaction(
    async (tx) => {
      await acquireAdminMutationLock(tx);
      const currentUser = await requireExistingUser(tx, userId);
      await ensureAnotherActiveAdminRemains(
        tx,
        currentUser,
        currentUser.role,
        isActiveInput,
      );
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { isActive: isActiveInput },
        select: userSelect,
      });

      if (currentUser.isActive !== isActiveInput) {
        await writeAuditEvent(tx, {
          actor,
          action: isActiveInput ? "USER_ACTIVATED" : "USER_DEACTIVATED",
          entityType: "USER",
          entityId: String(userId),
          outcome: "SUCCESS",
          source: "users.set-active",
          before: { isActive: currentUser.isActive },
          after: { isActive: isActiveInput },
        });
      }

      return updatedUser;
    },
    { isolationLevel: "ReadCommitted" },
  );
}
