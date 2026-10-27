import "server-only";

import { auth } from "@/auth";
import type { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export class AccessControlError extends Error {
  constructor(public readonly code: "UNAUTHENTICATED" | "FORBIDDEN") {
    super(code === "UNAUTHENTICATED" ? "Authentication required" : "Forbidden");
    this.name = "AccessControlError";
  }
}

export type VerifiedUser = {
  id: number;
  username: string;
  role: UserRole;
};

export async function requireUser(): Promise<VerifiedUser> {
  const session = await auth();
  const sessionId = session?.user?.id;

  if (typeof sessionId !== "string" || !/^[1-9]\d*$/.test(sessionId)) {
    throw new AccessControlError("UNAUTHENTICATED");
  }

  const id = Number(sessionId);
  if (!Number.isSafeInteger(id)) {
    throw new AccessControlError("UNAUTHENTICATED");
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AccessControlError("UNAUTHENTICATED");
  }

  return { id: user.id, username: user.username, role: user.role };
}

export async function requireRole(
  ...allowedRoles: UserRole[]
): Promise<VerifiedUser> {
  const user = await requireUser();

  if (allowedRoles.length === 0 || !allowedRoles.includes(user.role)) {
    throw new AccessControlError("FORBIDDEN");
  }

  return user;
}
