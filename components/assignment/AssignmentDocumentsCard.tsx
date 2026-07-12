import Card from "@/components/ui/Card"
import ViewDocumentButton from "@/components/assignment/view-document-button"
import UploadSignedPdfButton from "@/components/assignment/upload-signed-pdf-button"

interface Props {
  assignmentId: number
  generatedPdfPath: string | null
  signedPdfPath: string | null
}

export default function AssignmentDocumentsCard({
  assignmentId,
  generatedPdfPath,
  signedPdfPath,
}: Props) {
  return (
    <Card>
      <h2 className="mb-6 text-lg font-semibold">Centro documental</h2>

      <div className="space-y-4">
        {/* Responsiva generada */}

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Responsiva generada</p>

            <p className="text-sm text-slate-500">
              Documento generado automáticamente.
            </p>
          </div>

          {generatedPdfPath ? (
            <ViewDocumentButton assignmentId={assignmentId} type="generated" />
          ) : (
            <span className="text-sm text-slate-400">No disponible</span>
          )}
        </div>

        {/* Responsiva firmada */}

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Responsiva firmada</p>

            <p className="text-sm text-slate-500">
              Documento firmado por el empleado.
            </p>
          </div>

          {signedPdfPath ? (
            <ViewDocumentButton assignmentId={assignmentId} type="signed" />
          ) : generatedPdfPath ? (
            <UploadSignedPdfButton assignmentId={assignmentId} />
          ) : (
            <span className="text-sm text-slate-400">Pendiente</span>
          )}
        </div>
      </div>
    </Card>
  )
}
