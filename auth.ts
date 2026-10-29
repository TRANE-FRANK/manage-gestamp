import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import argon2 from "argon2";

import type { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditEvent } from "@/services/audit/service";

function isUserRole(value: unknown): value is UserRole {
  return value === "ADMIN" || value === "IT" || value === "SECURITY";
}

async function recordFailedLogin(username: string) {
  await prisma.$transaction((tx) =>
    writeAuditEvent(tx, {
      actor: null,
      action: "LOGIN_FAILED",
      entityType: "AUTHENTICATION",
      entityId: "credentials",
      outcome: "FAILURE",
      source: "auth.credentials",
      after: { username: username.slice(0, 100) },
    }),
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const username =
          typeof credentials.username === "string"
            ? credentials.username.trim()
            : "";
        const password =
          typeof credentials.password === "string" ? credentials.password : "";

        if (!username || !password) {
          await recordFailedLogin(username);
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username },
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

        if (
          !user ||
          !user.isActive ||
          !user.passwordHash.startsWith("$argon2id$")
        ) {
          await recordFailedLogin(username);
          return null;
        }

        let passwordMatches = false;
        try {
          passwordMatches = await argon2.verify(user.passwordHash, password);
        } catch {
          // Treat malformed or unsupported hashes as invalid credentials.
          await recordFailedLogin(username);
          return null;
        }

        if (!passwordMatches) {
          await recordFailedLogin(username);
          return null;
        }

        const fullName = [user.firstName, user.lastName]
          .filter(Boolean)
          .join(" ");

        return {
          id: String(user.id),
          name: fullName || user.username,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
  events: {
    async signIn({ user, account }) {
      if (account?.provider !== "credentials") return;

      const userId = Number(user.id);
      if (
        !Number.isSafeInteger(userId) ||
        userId <= 0 ||
        typeof user.username !== "string" ||
        !isUserRole(user.role)
      ) {
        throw new Error("Auth.js returned an invalid authenticated identity.");
      }

      await prisma.$transaction((tx) =>
        writeAuditEvent(tx, {
          actor: { id: userId, username: user.username, role: user.role },
          action: "LOGIN_SUCCEEDED",
          entityType: "AUTHENTICATION",
          entityId: String(userId),
          outcome: "SUCCESS",
          source: "auth.credentials",
        }),
      );
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.disabled = false;
      } else if (typeof token.id === "string" && /^[1-9]\d*$/.test(token.id)) {
        const currentUser = await prisma.user.findUnique({
          where: { id: Number(token.id) },
          select: { id: true, username: true, role: true, isActive: true },
        });

        if (!currentUser?.isActive) {
          delete token.id;
          delete token.role;
          delete token.username;
          token.disabled = true;
        } else {
          token.id = String(currentUser.id);
          token.username = currentUser.username;
          token.role = currentUser.role;
          token.disabled = false;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (
        token.disabled !== true &&
        session.user &&
        typeof token.id === "string" &&
        typeof token.username === "string" &&
        isUserRole(token.role)
      ) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.username = token.username;
      }
      return session;
    },
  },
});
