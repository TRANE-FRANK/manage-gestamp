import { NextResponse } from "next/server"

import { scanEquipment } from "@/services/scan"
import {
  AccessControlError,
  requireRole,
} from "@/lib/auth/authorization"
import { ValidationError } from "@/services/shared/errors"
import { parseScanEquipmentInput } from "@/services/scan/input"

export async function POST(request: Request) {
  try {
    await requireRole("ADMIN", "IT", "SECURITY")
  } catch (error) {
    if (!(error instanceof AccessControlError)) {
      return NextResponse.json(
        { success: false, message: "No fue posible validar el acceso." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error.code === "UNAUTHENTICATED"
            ? "Debes iniciar sesión para verificar una salida."
            : "No tienes permisos para verificar una salida.",
      },
      { status: error.code === "UNAUTHENTICATED" ? 401 : 403 },
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, message: "El cuerpo JSON no es válido." },
      { status: 400 },
    )
  }

  try {
    const input = parseScanEquipmentInput(body)
    const result = await scanEquipment(input)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: "No fue posible procesar la verificación.",
      },
      {
        status: 500,
      },
    )
  }
}
