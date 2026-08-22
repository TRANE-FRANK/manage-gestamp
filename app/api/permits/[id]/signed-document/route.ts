import { readFile } from "fs/promises"
import path from "path"

import { getPermitDetails } from "@/services/permit"

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string
    }>
  },
) {
  const { id } = await params

  const permitId = Number(id)

  if (!Number.isInteger(permitId) || permitId <= 0) {
    return new Response("ID de permiso inválido.", {
      status: 400,
    })
  }

  const permit = await getPermitDetails(permitId)

  if (!permit || !permit.signedPdfPath) {
    return new Response("El PDF firmado no está disponible.", {
      status: 404,
    })
  }

  try {
    const filePath = path.join(process.cwd(), "storage", permit.signedPdfPath)

    const file = await readFile(filePath)

    return new Response(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="permiso-firmado-${permit.folio}.pdf"`,
      },
    })
  } catch (error) {
    console.error(error)

    return new Response("No fue posible abrir el PDF firmado.", {
      status: 500,
    })
  }
}
