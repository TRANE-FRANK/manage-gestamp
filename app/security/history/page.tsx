import Link from "next/link"

import {
  getScanStats,
  getEquipmentUsage,
  listScanLogs,
  getEmployeeUsage,
  getValidationStats,
} from "@/services/scan"

type Props = {
  searchParams: Promise<{
    period?: string
    result?: string
    search?: string
    page?: string
  }>
}

function getPeriodDates(period: string) {
  const now = new Date()

  const start = new Date(now)
  const end = new Date(now)

  start.setHours(0, 0, 0, 0)

  end.setHours(0, 0, 0, 0)
  end.setDate(end.getDate() + 1)

  if (period === "week") {
    const day = start.getDay()

    const difference = day === 0 ? 6 : day - 1

    start.setDate(start.getDate() - difference)
  }

  if (period === "month") {
    start.setDate(1)
  }

  return {
    startDate: start,
    endDate: end,
  }
}

function getResultLabel(result: "ALLOWED" | "DENIED") {
  return result === "ALLOWED" ? "Permitido" : "Denegado"
}

function getResultClass(result: "ALLOWED" | "DENIED") {
  return result === "ALLOWED"
    ? "bg-green-100 text-green-700"
    : "bg-red-100 text-red-700"
}

export default async function SecurityHistoryPage({ searchParams }: Props) {
  const params = await searchParams

  const period =
    params.period === "week" || params.period === "month"
      ? params.period
      : "today"

  const page = Math.max(Number.parseInt(params.page ?? "1", 10) || 1, 1)
  const pageSize = 10

  const result =
    params.result === "ALLOWED" || params.result === "DENIED"
      ? params.result
      : undefined

  const search = params.search?.trim() || undefined

  const { startDate, endDate } = getPeriodDates(period)

  const [
    scanLogsResult,
    stats,
    equipmentUsage,
    employeeUsage,
    validationStats,
  ] = await Promise.all([
    listScanLogs({
      startDate,
      endDate,
      result,
      search,
      page,
      pageSize,
    }),

    getScanStats(startDate, endDate),
    getEquipmentUsage(startDate, endDate),
    getEmployeeUsage(startDate, endDate),
    getValidationStats(startDate, endDate),
  ])

  const { items: scanLogs, total, totalPages } = scanLogsResult

  const validationReasonLabels: Record<string, string> = {
    ALLOWED: "Salida autorizada",
    INVALID_ASSET_TAG: "Asset Tag inválido",
    EQUIPMENT_NOT_FOUND: "Equipo no registrado",
    NO_PERMIT: "Sin permiso",
    CANCELLED: "Permiso cancelado",
    EXPIRED: "Permiso expirado",
    NOT_STARTED: "Permiso aún no vigente",
    NOT_ACTIVE: "Permiso no activo",
  }

  return (
    <main className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Historial de Vigilancia
          </h1>

          <p className="mt-1 text-slate-500">
            Registro de los escaneos realizados en la salida.
          </p>
        </div>

        <Link
          href="/security"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          Ir a Vigilancia
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Escaneos</p>

          <p className="mt-1 text-3xl font-bold text-slate-900">
            {stats.total}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Permitidos</p>

          <p className="mt-1 text-3xl font-bold text-green-600">
            {stats.allowed}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Denegados</p>

          <p className="mt-1 text-3xl font-bold text-red-600">{stats.denied}</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Equipos únicos</p>

          <p className="mt-1 text-3xl font-bold text-blue-600">
            {stats.uniqueEquipment}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Resultados de validación
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Resumen de las validaciones realizadas durante el periodo
            seleccionado.
          </p>
        </div>

        {validationStats.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">
            No existen validaciones en este periodo.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {validationStats.map((item) => {
              const isAllowed = item.reason === "ALLOWED"

              return (
                <div key={item.reason} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-600">
                      {validationReasonLabels[item.reason] ?? item.reason}
                    </p>

                    <span className={isAllowed ? "text-lg" : "text-lg"}>
                      {isAllowed ? "🟢" : "🔴"}
                    </span>
                  </div>

                  <p
                    className={`mt-2 text-2xl font-bold ${
                      isAllowed ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {item.count}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm">
        <form
          method="GET"
          className="grid gap-3 md:grid-cols-[180px_180px_1fr_auto]"
        >
          <select
            name="period"
            defaultValue={period}
            className="rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
          >
            <option value="today">Hoy</option>

            <option value="week">Esta semana</option>

            <option value="month">Este mes</option>
          </select>

          <select
            name="result"
            defaultValue={result ?? ""}
            className="rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
          >
            <option value="">Todos</option>

            <option value="ALLOWED">Permitidos</option>

            <option value="DENIED">Denegados</option>
          </select>

          <input
            type="text"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Buscar equipo, empleado o folio..."
            className="rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white transition hover:bg-blue-700"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold">Fecha y hora</th>

                <th className="px-4 py-3 font-semibold">Equipo</th>

                <th className="px-4 py-3 font-semibold">Empleado</th>

                <th className="px-4 py-3 font-semibold">Empresa</th>

                <th className="px-4 py-3 font-semibold">Folio</th>

                <th className="px-4 py-3 font-semibold">Resultado</th>

                <th className="px-4 py-3 font-semibold">Motivo</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {scanLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No existen escaneos para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                scanLogs.map((scan) => (
                  <tr key={scan.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      {scan.scannedAt.toLocaleString("es-MX")}
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {scan.assetTag ?? scan.permit?.equipment.assetTag ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      {scan.permit
                        ? `${scan.permit.employee.firstName} ${scan.permit.employee.lastName}`
                        : "—"}
                    </td>

                    <td className="px-4 py-3">
                      {scan.permit?.equipment.company ?? "—"}
                    </td>

                    <td className="px-4 py-3">{scan.permit?.folio ?? "—"}</td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getResultClass(
                          scan.result,
                        )}`}
                      >
                        {scan.result === "ALLOWED" ? "🟢 " : "🔴 "}

                        {getResultLabel(scan.result)}
                      </span>
                    </td>

                    <td className="max-w-xs px-4 py-3">{scan.notes ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {totalPages > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t bg-white px-4 py-4">
          <p className="text-sm text-slate-500">
            Mostrando{" "}
            <span className="font-medium text-slate-900">
              {Math.min((page - 1) * pageSize + 1, total)}
            </span>{" "}
            –{" "}
            <span className="font-medium text-slate-900">
              {Math.min(page * pageSize, total)}
            </span>{" "}
            de <span className="font-medium text-slate-900">{total}</span>
          </p>

          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={`/security/history?${new URLSearchParams({
                  ...(period ? { period } : {}),
                  ...(result ? { result } : {}),
                  ...(search ? { search } : {}),
                  page: String(page - 1),
                }).toString()}`}
                className="rounded-lg border px-3 py-2 text-sm transition hover:bg-slate-100"
              >
                ← Anterior
              </Link>
            ) : (
              <span className="rounded-lg border px-3 py-2 text-sm text-slate-400">
                ← Anterior
              </span>
            )}

            <span className="px-2 text-sm text-slate-600">
              Página {page} de {totalPages}
            </span>

            {page < totalPages ? (
              <Link
                href={`/security/history?${new URLSearchParams({
                  ...(period ? { period } : {}),
                  ...(result ? { result } : {}),
                  ...(search ? { search } : {}),
                  page: String(page + 1),
                }).toString()}`}
                className="rounded-lg border px-3 py-2 text-sm transition hover:bg-slate-100"
              >
                Siguiente →
              </Link>
            ) : (
              <span className="rounded-lg border px-3 py-2 text-sm text-slate-400">
                Siguiente →
              </span>
            )}
          </div>
        </div>
      )}
      <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b bg-slate-50 px-4 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Uso de equipos
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Número de salidas autorizadas por equipo durante el periodo
            seleccionado.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b">
              <tr>
                <th className="px-4 py-3 font-semibold">Equipo</th>

                <th className="px-4 py-3 font-semibold">Empleado</th>

                <th className="px-4 py-3 text-right font-semibold">Salidas</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {equipmentUsage.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No existen salidas autorizadas en este periodo.
                  </td>
                </tr>
              ) : (
                equipmentUsage.map((item) => (
                  <tr
                    key={item.assetTag}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium">{item.assetTag}</td>

                    <td className="px-4 py-3">{item.employee}</td>

                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-blue-600">
                        {item.count}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b bg-slate-50 px-4 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Uso por empleado
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Número de salidas autorizadas registradas por empleado durante el
            periodo seleccionado.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b">
              <tr>
                <th className="px-4 py-3 font-semibold">Empleado</th>

                <th className="px-4 py-3 text-right font-semibold">Salidas</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {employeeUsage.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No existen salidas autorizadas en este periodo.
                  </td>
                </tr>
              ) : (
                employeeUsage.map((item) => (
                  <tr
                    key={item.employeeId}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium">{item.employee}</td>

                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-blue-600">
                        {item.count}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
