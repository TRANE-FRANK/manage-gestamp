"use client"

import Link from "next/link"
import { useScanResult } from "@/components/security/ScanResultContext"
import SecurityResult from "./SecurityResult"
import { getDaysUntil } from "@/lib/date"

export default function SecuritySearchResult() {
  const { result, setResult, searchedAssetTag, setSearchedAssetTag } = useScanResult()

  function clearResult() {
    setResult(null)
    setSearchedAssetTag(null)
  }

  if (!result) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">No hay una verificación activa</h1>
          <p className="mt-2 text-slate-600">
            Inicia el escaneo desde el formulario para registrar una verificación.
          </p>
          {searchedAssetTag && (
            <div className="mt-6">
              <p className="text-sm text-gray-500">Asset Tag</p>
              <p className="text-xl font-semibold">{searchedAssetTag}</p>
            </div>
          )}
          <Link
            href="/security"
            onClick={clearResult}
            className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-3 text-white"
          >
            Volver al escáner
          </Link>
        </div>
      </main>
    )
  }

  if (!result.equipment || !result.permit) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <div className="rounded-lg bg-red-600 p-6 text-white">
            <h1 className="text-3xl font-bold">❌ SALIDA DENEGADA</h1>
            <p className="mt-2 text-lg">{result.message}</p>
          </div>
          {result.equipment && (
            <div className="mt-6">
              <p className="text-sm text-gray-500">Equipo</p>
              <p className="text-xl font-semibold">{result.equipment.assetTag}</p>
              <p className="mt-2 text-sm text-gray-500">Empresa</p>
              <p className="text-xl font-semibold">{result.equipment.company}</p>
            </div>
          )}
          {!result.equipment && searchedAssetTag && (
            <div className="mt-6">
              <p className="text-sm text-gray-500">Asset Tag</p>
              <p className="text-xl font-semibold">{searchedAssetTag}</p>
            </div>
          )}
          <BackToScanner onClick={clearResult} />
          <SecurityResult />
        </div>
      </main>
    )
  }

  const permit = result.permit
  const daysLeft = getDaysUntil(new Date(permit.expirationDate))
  const isCancelled = permit.status === "CANCELLED"
  const isExpired = permit.status === "EXPIRED"

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <div className={`mb-6 rounded-lg p-6 text-white ${result.allowed ? "bg-green-600" : "bg-red-600"}`}>
          <h1 className="text-3xl font-bold">
            {result.allowed ? "✅ SALIDA AUTORIZADA" : "❌ SALIDA DENEGADA"}
          </h1>
          <p className="mt-2 text-lg">{result.message}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Info label="Empleado">
            {permit.employee.firstName} {permit.employee.lastName}
          </Info>
          {permit.employee.department && (
            <Info label="Departamento">{permit.employee.department}</Info>
          )}
          <Info label="Equipo">{result.equipment.assetTag}</Info>
          <Info label="Empresa">{result.equipment.company}</Info>
          <Info label="Folio">{permit.folio}</Info>
          <Info label="Estado">
            <span className={`font-bold ${isCancelled || isExpired ? "text-red-600" : "text-green-600"}`}>
              {isCancelled ? "Cancelado" : isExpired ? "Expirado" : "Activo"}
            </span>
          </Info>
          <Info label="Vigencia">
            {new Date(permit.startDate).toLocaleDateString("es-MX")} – {new Date(permit.expirationDate).toLocaleDateString("es-MX")}
          </Info>
          {permit.cancellationReason && (
            <div className="rounded-lg bg-red-50 p-4 md:col-span-2">
              <p className="text-sm font-medium text-red-700">Motivo de cancelación</p>
              <p className="mt-1 text-lg font-semibold text-red-900">{permit.cancellationReason}</p>
              {permit.cancelledAt && (
                <p className="mt-2 text-sm text-red-700">
                  Cancelado el {new Date(permit.cancelledAt).toLocaleDateString("es-MX")}
                </p>
              )}
            </div>
          )}
          {!isCancelled && !isExpired && (
            <Info label="Días restantes">
              <span className={`text-2xl font-bold ${daysLeft <= 30 ? "text-orange-600" : "text-green-600"}`}>
                {daysLeft < 0 ? `Vencido hace ${Math.abs(daysLeft)} días` : `${daysLeft} días`}
              </span>
            </Info>
          )}
          {isExpired && (
            <p className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700 md:col-span-2">
              El permiso ya no está vigente.
            </p>
          )}
        </div>

        <BackToScanner onClick={clearResult} />
        <SecurityResult />
      </div>
    </main>
  )
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-semibold">{children}</p>
    </div>
  )
}

function BackToScanner({ onClick }: { onClick: () => void }) {
  return (
    <Link
      href="/security"
      onClick={onClick}
      className="mt-6 block w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-white transition hover:bg-blue-700"
    >
      Nueva búsqueda
    </Link>
  )
}
