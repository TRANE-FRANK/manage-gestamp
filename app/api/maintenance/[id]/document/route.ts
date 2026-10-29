import {
  handleDocumentError,
  pdfResponse,
} from "@/services/document"
import { getMaintenanceDocument } from "@/services/maintenance"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const maintenanceId = Number(id)
    const pdf = await getMaintenanceDocument(maintenanceId)

    return pdfResponse(pdf, `maintenance-${maintenanceId}.pdf`)
  } catch (error) {
    return handleDocumentError(error)
  }
}
