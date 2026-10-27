import { beforeEach, describe, expect, it, vi } from "vitest"

const { scanEquipmentMock, requireRoleMock } = vi.hoisted(() => ({
  scanEquipmentMock: vi.fn(),
  requireRoleMock: vi.fn(),
}))

vi.mock("@/services/scan", () => ({ scanEquipment: scanEquipmentMock }))
vi.mock("@/lib/auth/authorization", () => ({
  requireRole: requireRoleMock,
  AccessControlError: class AccessControlError extends Error {
    constructor(public readonly code: "UNAUTHENTICATED" | "FORBIDDEN") {
      super(code)
    }
  },
}))

import { ValidationError } from "@/services/shared/errors"
import { POST } from "@/app/api/permits/scan/route"

function request(body: string, contentType = "application/json") {
  return new Request("http://localhost/api/permits/scan", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  requireRoleMock.mockResolvedValue({
    id: 3,
    username: "operator",
    role: "ADMIN",
  })
  scanEquipmentMock.mockResolvedValue({
    allowed: true,
    result: "ALLOWED",
    message: "Salida autorizada.",
    equipment: { assetTag: "TAG-1", company: "GP2" },
    permit: null,
  })
})

describe("POST /api/permits/scan", () => {
  it("mapea sesión ausente a 401 y no inicia el escaneo", async () => {
    const { AccessControlError } = await import("@/lib/auth/authorization")
    requireRoleMock.mockRejectedValue(
      new AccessControlError("UNAUTHENTICATED"),
    )

    const response = await POST(request(JSON.stringify({ assetTag: "TAG-1" })))

    expect(response.status).toBe(401)
    expect(await response.json()).not.toHaveProperty("result")
    expect(scanEquipmentMock).not.toHaveBeenCalled()
  })

  it("mapea un rol insuficiente a 403 sin resultado de escaneo", async () => {
    const { AccessControlError } = await import("@/lib/auth/authorization")
    requireRoleMock.mockRejectedValue(new AccessControlError("FORBIDDEN"))

    const response = await POST(request(JSON.stringify({ assetTag: "TAG-1" })))

    expect(response.status).toBe(403)
    expect(await response.json()).not.toHaveProperty("result")
    expect(scanEquipmentMock).not.toHaveBeenCalled()
  })

  it.each(["ADMIN", "IT", "SECURITY"] as const)(
    "permite el rol %s y delega la verificación al servicio",
    async (role) => {
      requireRoleMock.mockResolvedValue({ id: 3, username: "operator", role })
      const response = await POST(
        request(JSON.stringify({ assetTag: "TAG-1" })),
      )

      expect(requireRoleMock).toHaveBeenCalledWith("ADMIN", "IT", "SECURITY")
      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({ result: "ALLOWED" })
      expect(scanEquipmentMock).toHaveBeenCalledWith({ assetTag: "TAG-1" })
    },
  )

  it.each([
    ["campo ausente", {}],
    ["cadena vacía", { assetTag: "   " }],
    ["tipo incorrecto", { assetTag: 123 }],
    ["valor demasiado largo", { assetTag: "A".repeat(101) }],
    ["caracteres de control", { assetTag: "TAG\n1" }],
  ])("rechaza %s antes de llamar al servicio", async (_label, body) => {
    const response = await POST(request(JSON.stringify(body)))

    expect(response.status).toBe(400)
    expect(await response.json()).not.toHaveProperty("result")
    expect(scanEquipmentMock).not.toHaveBeenCalled()
    expect(requireRoleMock).toHaveBeenCalledWith("ADMIN", "IT", "SECURITY")
  })

  it("rechaza JSON mal formado con 400", async () => {
    const response = await POST(request("{"))

    expect(response.status).toBe(400)
    expect(scanEquipmentMock).not.toHaveBeenCalled()
  })

  it("devuelve 500 genérico ante errores internos, sin simular DENIED", async () => {
    scanEquipmentMock.mockRejectedValue(new Error("db details"))

    const response = await POST(request(JSON.stringify({ assetTag: "TAG-1" })))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({
      success: false,
      message: "No fue posible procesar la verificación.",
    })
    expect(body).not.toHaveProperty("result")
    expect(body).not.toHaveProperty("allowed")
  })

  it("mapea los errores de validación de servicio a 400", async () => {
    scanEquipmentMock.mockRejectedValue(
      new ValidationError("El Asset Tag no tiene un formato válido."),
    )

    const response = await POST(request(JSON.stringify({ assetTag: "TAG-1" })))

    expect(response.status).toBe(400)
    expect(await response.json()).not.toHaveProperty("result")
  })
})
