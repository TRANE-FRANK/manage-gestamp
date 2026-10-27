import { NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"

import { getPermitDetails } from "@/services/permit"
import { AccessControlError } from "@/lib/auth/authorization"

interface Props {
  params: Promise<{
    id: string
  }>
}

export async function GET(_: Request, { params }: Props) {
  const { id } = await params

  const permitId = Number(id)

  if (!Number.isInteger(permitId) || permitId <= 0) {
    return new NextResponse("Permiso no válido.", {
      status: 400,
    })
  }

  let permit
  try {
    permit = await getPermitDetails(permitId)
  } catch (error) {
    if (error instanceof AccessControlError) {
      return new NextResponse(
        error.code === "UNAUTHENTICATED"
          ? "Debes iniciar sesión para descargar este documento."
          : "No tienes permisos para descargar este documento.",
        { status: error.code === "UNAUTHENTICATED" ? 401 : 403 },
      )
    }

    throw error
  }

  if (!permit?.generatedPdfPath) {
    return new NextResponse("El formato no ha sido generado.", {
      status: 404,
    })
  }

  const filePath = path.join(process.cwd(), "storage", permit.generatedPdfPath)

  try {
    const file = await fs.readFile(filePath)

    return new NextResponse(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    })
  } catch {
    return new NextResponse("No se encontró el PDF.", {
      status: 404,
    })
  }
}
