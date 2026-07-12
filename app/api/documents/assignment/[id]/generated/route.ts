import { getAssignmentDocument } from "@/services/document"

import { pdfResponse, handleDocumentError } from "@/services/document"

interface Props {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: Request, { params }: Props) {
  try {
    const { id } = await params

    const pdf = await getAssignmentDocument(Number(id), "generated")

    return pdfResponse(pdf)
  } catch (error) {
    return handleDocumentError(error)
  }
}
