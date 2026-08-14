import Link from "next/link"

import { getDaysUntil } from "@/lib/date"

import { scanEquipment } from "@/services/scan"

import SecurityResult from "./SecurityResult"

type Props = {
  searchParams: Promise<{
    assetTag?: string
  }>
}

export default async function SecuritySearchPage({ searchParams }: Props) {
  const { assetTag } = await searchParams

  /*
   * No se recibió Asset Tag
   */
  if (!assetTag) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Equipo no encontrado</h1>

          <Link
            href="/security"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            Nueva búsqueda
          </Link>
        </div>
      </main>
    )
  }

  /*
   * Ejecutar validación
   */
  const result = await scanEquipment({
    assetTag,
  })

  /*
   * Equipo no registrado
   */
  if (!result.equipment) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <div className="rounded-lg bg-red-600 p-6 text-white">
            <h1 className="text-3xl font-bold">❌ SALIDA DENEGADA</h1>

            <p className="mt-2 text-lg">{result.message}</p>
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-500">Asset Tag</p>

            <p className="text-xl font-semibold">{assetTag}</p>
          </div>

          <Link
            href="/security"
            className="mt-6 block w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-white transition hover:bg-blue-700"
          >
            Nueva búsqueda
          </Link>

          <SecurityResult />
        </div>
      </main>
    )
  }

  /*
   * Equipo registrado pero sin permiso
   */
  if (!result.permit) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <div className="rounded-lg bg-red-600 p-6 text-white">
            <h1 className="text-3xl font-bold">❌ SALIDA DENEGADA</h1>

            <p className="mt-2 text-lg">{result.message}</p>
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-500">Equipo</p>

            <p className="text-xl font-semibold">{result.equipment.assetTag}</p>

            <p className="mt-2 text-sm text-gray-500">Empresa</p>

            <p className="text-xl font-semibold">{result.equipment.company}</p>
          </div>

          <Link
            href="/security"
            className="mt-6 block w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-white transition hover:bg-blue-700"
          >
            Nueva búsqueda
          </Link>

          <SecurityResult />
        </div>
      </main>
    )
  }

  /*
   * Información del permiso
   */
  const daysLeft = getDaysUntil(result.permit.expirationDate)

  const isCancelled = result.permit.status === "CANCELLED"

  const isExpired = result.permit.status === "EXPIRED"

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <div
          className={`mb-6 rounded-lg p-6 text-white ${
            result.allowed ? "bg-green-600" : "bg-red-600"
          }`}
        >
          <h1 className="text-3xl font-bold">
            {result.allowed ? "✅ SALIDA AUTORIZADA" : "❌ SALIDA DENEGADA"}
          </h1>

          <p className="mt-2 text-lg">{result.message}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Empleado</p>

            <p className="text-xl font-semibold">
              {result.permit.employee.firstName}{" "}
              {result.permit.employee.lastName}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Departamento</p>

            <p className="text-xl font-semibold">
              {result.permit.employee.department ?? "Sin departamento"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Equipo</p>

            <p className="text-xl font-semibold">{result.equipment.assetTag}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Empresa</p>

            <p className="text-xl font-semibold">{result.equipment.company}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Folio</p>

            <p className="text-xl font-semibold">{result.permit.folio}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Estado</p>

            <p
              className={`text-xl font-bold ${
                isCancelled || isExpired ? "text-red-600" : "text-green-600"
              }`}
            >
              {isCancelled ? "Cancelado" : isExpired ? "Expirado" : "Activo"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Vencimiento</p>

            <p className="text-xl font-semibold">
              {result.permit.expirationDate.toLocaleDateString("es-MX")}
            </p>
          </div>

          {isCancelled && (
            <div className="rounded-lg bg-red-50 p-4 md:col-span-2">
              <p className="text-sm font-medium text-red-700">
                Motivo de cancelación
              </p>

              <p className="mt-1 text-lg font-semibold text-red-900">
                {result.permit.cancellationReason ?? "Sin motivo registrado"}
              </p>

              {result.permit.cancelledAt && (
                <p className="mt-2 text-sm text-red-700">
                  Cancelado el{" "}
                  {result.permit.cancelledAt.toLocaleDateString("es-MX")}
                </p>
              )}
            </div>
          )}

          {!isCancelled && !isExpired && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Días restantes</p>

              <p
                className={`text-2xl font-bold ${
                  daysLeft <= 30 ? "text-orange-600" : "text-green-600"
                }`}
              >
                {daysLeft < 0
                  ? `Vencido hace ${Math.abs(daysLeft)} días`
                  : `${daysLeft} días`}
              </p>
            </div>
          )}

          {isExpired && (
            <div className="rounded-lg bg-red-50 p-4 md:col-span-2">
              <p className="text-sm font-medium text-red-700">
                El permiso ya no está vigente.
              </p>
            </div>
          )}
        </div>
        <Link
          href="/security"
          className="mt-6 block w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-white transition hover:bg-blue-700"
        >
          Nueva búsqueda
        </Link>
        <SecurityResult />
      </div>
    </main>
  )
}
