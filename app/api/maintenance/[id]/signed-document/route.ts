import { handleDocumentError, pdfResponse } from "@/services/document"

import { getMaintenanceSignedDocument } from "@/services/maintenance"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const maintenanceId = Number(id)

    const pdf = await getMaintenanceSignedDocument(maintenanceId)

    return pdfResponse(pdf, `maintenance-${maintenanceId}-firmada.pdf`)
  } catch (error) {
    return handleDocumentError(error)
  }
}
