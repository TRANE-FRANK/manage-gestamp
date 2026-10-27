import { describe, expect, it } from "vitest"

import {
  getPageAccessDecision,
  getRoleHomePath,
  sanitizeCallbackUrl,
} from "@/lib/auth/page-policy"

describe("política global de páginas", () => {
  it("mantiene público el login y exige identidad en las demás páginas", () => {
    expect(getPageAccessDecision("/login", undefined)).toBe("public")
    expect(getPageAccessDecision("/equipment", undefined)).toBe(
      "unauthenticated",
    )
  })

  it.each(["ADMIN", "IT", "SECURITY"] as const)(
    "permite %s en Vigilancia y sus subrutas",
    (role) => {
      expect(getPageAccessDecision("/security", role)).toBe("allowed")
      expect(getPageAccessDecision("/security/search", role)).toBe("allowed")
      expect(getPageAccessDecision("/security/history", role)).toBe("allowed")
    },
  )

  it.each(["/", "/employees", "/equipment", "/assignments", "/maintenance", "/permits"])(
    "reserva %s para ADMIN e IT",
    (pathname) => {
      expect(getPageAccessDecision(pathname, "ADMIN")).toBe("allowed")
      expect(getPageAccessDecision(pathname, "IT")).toBe("allowed")
      expect(getPageAccessDecision(pathname, "SECURITY")).toBe("forbidden")
    },
  )

  it("reserva la futura administración de usuarios únicamente para ADMIN", () => {
    expect(getPageAccessDecision("/users", "ADMIN")).toBe("allowed")
    expect(getPageAccessDecision("/users/42", "ADMIN")).toBe("allowed")
    expect(getPageAccessDecision("/users", "IT")).toBe("forbidden")
    expect(getPageAccessDecision("/users", "SECURITY")).toBe("forbidden")
  })

  it("envía SECURITY a Vigilancia y los roles administrativos al inicio", () => {
    expect(getRoleHomePath("SECURITY")).toBe("/security")
    expect(getRoleHomePath("ADMIN")).toBe("/")
    expect(getRoleHomePath("IT")).toBe("/")
  })

  it("conserva destinos internos y rechaza callback URLs externos o de autenticación", () => {
    expect(sanitizeCallbackUrl("/maintenance?historyPage=2")).toBe(
      "/maintenance?historyPage=2",
    )
    expect(sanitizeCallbackUrl("https://attacker.invalid/" )).toBe("/")
    expect(sanitizeCallbackUrl("//attacker.invalid/" )).toBe("/")
    expect(sanitizeCallbackUrl("/login" )).toBe("/")
    expect(sanitizeCallbackUrl("/api/auth/callback/credentials" )).toBe("/")
  })
})
