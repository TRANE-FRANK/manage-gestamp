import { NextResponse } from "next/server"

import { scanEquipment } from "@/services/scan"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const result = await scanEquipment({
      assetTag: body.assetTag,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error al verificar salida:", error)

    return NextResponse.json(
      {
        allowed: false,
        result: "DENIED",
        message: "No fue posible procesar la verificación.",
        equipment: null,
        permit: null,
      },
      {
        status: 500,
      },
    )
  }
}
