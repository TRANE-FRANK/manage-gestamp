import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import argon2 from "argon2";

import type { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

function isUserRole(value: unknown): value is UserRole {
  return value === "ADMIN" || value === "IT" || value === "SECURITY";
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

        if (!username || !password) return null;

        const user = await prisma.user.findUnique({
          where: { username },
          select: {
            id: true,
            username: true,
            passwordHash: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        });

        if (!user || !user.passwordHash.startsWith("$argon2id$")) return null;

        let passwordMatches = false;
        try {
          passwordMatches = await argon2.verify(user.passwordHash, password);
        } catch {
          // Treat malformed or unsupported hashes as invalid credentials.
          return null;
        }

        if (!passwordMatches) return null;

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
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
      }
      return token;
    },
    session({ session, token }) {
      if (
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
