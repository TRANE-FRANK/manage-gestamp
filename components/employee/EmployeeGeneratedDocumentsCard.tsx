import SectionCard from "@/components/ui/SectionCard"

import ViewDocumentButton from "@/components/assignment/view-document-button"
import UploadSignedPdfButton from "@/components/assignment/upload-signed-pdf-button"

import type { EmployeeDetails } from "@/services/employee"

interface Props {
  employee: EmployeeDetails
}

export default function EmployeeGeneratedDocumentsCard({ employee }: Props) {
  return (
    <SectionCard title="Documentos">
      {employee.assignments.length === 0 ? (
        <p className="text-sm text-slate-500">
          Este empleado aún no tiene documentos.
        </p>
      ) : (
        <div className="space-y-6">
          {employee.assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="mb-4">
                <h3 className="font-medium">
                  {assignment.equipment.brand} {assignment.equipment.model}
                </h3>

                <p className="text-sm text-slate-500">
                  {assignment.equipment.assetTag}
                </p>
              </div>

              <div className="space-y-3">
                {/* Responsiva generada */}

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">Responsiva generada</p>

                    <p className="text-sm text-slate-500">
                      Documento generado automáticamente.
                    </p>
                  </div>

                  {assignment.generatedPdfPath ? (
                    <ViewDocumentButton
                      assignmentId={assignment.id}
                      type="generated"
                    />
                  ) : (
                    <span className="text-sm text-slate-400">
                      No disponible
                    </span>
                  )}
                </div>

                {/* Responsiva firmada */}

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">Responsiva firmada</p>

                    <p className="text-sm text-slate-500">
                      Documento firmado por el empleado.
                    </p>
                  </div>

                  {assignment.signedPdfPath ? (
                    <ViewDocumentButton
                      assignmentId={assignment.id}
                      type="signed"
                    />
                  ) : assignment.generatedPdfPath ? (
                    <UploadSignedPdfButton assignmentId={assignment.id} />
                  ) : (
                    <span className="text-sm text-slate-400">Pendiente</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
