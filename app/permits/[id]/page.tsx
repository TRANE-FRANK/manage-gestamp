import Link from "next/link"
import { notFound } from "next/navigation"

import Card from "@/components/ui/Card"
import GeneratePermitDocumentButton from "./GeneratePermitDocumentButton"
import ViewPermitDocumentButton from "./ViewPermitDocumentButton"
import UploadSignedPermitForm from "./UploadSignedPermitForm"
import ViewSignedPermitDocumentButton from "./ViewSignedPermitDocumentButton"
import AuthorizeDepartureButton from "./AuthorizeDepartureButton"
import { getPermitDetails} from "@/services/permit"

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function PermitPage({ params }: Props) {
  const { id } = await params

  const permitId = Number(id)

  if (!Number.isInteger(permitId) || permitId <= 0) {
    notFound()
  }

  const permit = await getPermitDetails(permitId)

  if (!permit) {
    notFound()
  }

  const isSigned = !!permit.signedPdfPath
  const isGenerated = !!permit.generatedPdfPath

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Permiso {permit.folio}</h1>

          <p className="mt-1 text-sm text-slate-500">
            Información y seguimiento del permiso de salida.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <GeneratePermitDocumentButton permitId={permit.id} />
          <ViewPermitDocumentButton permitId={permit.id} />

          {isSigned && <ViewSignedPermitDocumentButton permitId={permit.id} />}

          {permit.status === "ACTIVE" && !permit.departureAuthorized && (
            <AuthorizeDepartureButton permitId={permit.id} />
          )}

          <Link
            href="/permits"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Volver
          </Link>

          {permit.status === "ACTIVE" && (
            <Link
              href={`/permits/${permit.id}/renew`}
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
            >
              Renovar permiso
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">
            Información del empleado
          </h2>

          <div className="space-y-3 text-sm">
            <p>
              <strong>Nombre:</strong> {permit.employee.firstName}{" "}
              {permit.employee.lastName}
            </p>

            <p>
              <strong>SAP:</strong> {permit.employee.sapNumber}
            </p>

            <p>
              <strong>Departamento:</strong>{" "}
              {permit.employee.department ?? "No especificado"}
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Información del equipo</h2>

          <div className="space-y-3 text-sm">
            <p>
              <strong>Asset Tag:</strong> {permit.equipment.assetTag}
            </p>

            <p>
              <strong>Tipo:</strong>{" "}
              {permit.equipment.type ?? "No especificado"}
            </p>

            <p>
              <strong>Marca:</strong>{" "}
              {permit.equipment.brand ?? "No especificada"}
            </p>

            <p>
              <strong>Modelo:</strong>{" "}
              {permit.equipment.model ?? "No especificado"}
            </p>

            <p>
              <strong>Número de serie:</strong>{" "}
              {permit.equipment.serialNumber ?? "No especificado"}
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Vigencia y estado</h2>

          <div className="space-y-3 text-sm">
            <p>
              <strong>Inicio:</strong>{" "}
              {permit.startDate.toLocaleDateString("es-MX")}
            </p>

            <p>
              <strong>Vencimiento:</strong>{" "}
              {permit.expirationDate.toLocaleDateString("es-MX")}
            </p>

            <p>
              <strong>Estado:</strong> {permit.status}
            </p>

            <p>
              <strong>Salida autorizada:</strong>{" "}
              {permit.departureAuthorized ? "Sí" : "No"}
            </p>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Estado del proceso</h2>

          <div className="space-y-4">
            {/* 1. FORMATO */}
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">1. Formato del permiso</p>

                  <p className="mt-1 text-sm text-slate-500">
                    {isGenerated
                      ? "El formato fue generado y está listo para imprimir."
                      : "Pendiente de generar el formato."}
                  </p>
                </div>

                {isGenerated && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    Generado
                  </span>
                )}
              </div>
            </div>

            {/* 2. FIRMAS */}
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">2. Documento firmado</p>

                  <p className="mt-1 text-sm text-slate-500">
                    {isSigned
                      ? "El documento firmado fue recibido y cargado correctamente."
                      : "Pendiente de recibir el documento con las firmas correspondientes."}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    isSigned
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {isSigned ? "Firmado" : "Pendiente"}
                </span>
              </div>

              {!isSigned && isGenerated && (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <UploadSignedPermitForm permitId={permit.id} />
                </div>
              )}

              {!isSigned && !isGenerated && (
                <p className="mt-3 text-xs text-slate-400">
                  Primero debes generar el formato del permiso antes de cargar
                  el documento firmado.
                </p>
              )}
            </div>

            {/* 3. SALIDA */}
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">3. Salida del equipo</p>

                  <p className="mt-1 text-sm text-slate-500">
                    {permit.departureAuthorized
                      ? isSigned
                        ? "Salida autorizada y documento firmado registrado."
                        : "Salida autorizada temporalmente. Falta cargar posteriormente el documento firmado."
                      : "La salida todavía no está autorizada."}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    permit.departureAuthorized
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {permit.departureAuthorized ? "Autorizada" : "No autorizada"}
                </span>
              </div>

              {permit.departureAuthorized && !isSigned && (
                <p className="mt-3 rounded-md bg-orange-50 p-3 text-sm text-orange-700">
                  La salida fue autorizada como excepción, pero el PDF firmado
                  sigue pendiente de cargar.
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
