import Link from "next/link"

import HistoryFilters from "./HistoryFilters"
import HistoryStats from "./HistoryStats"

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
    ? "bg-green-100 text-green-700 ring-1 ring-inset ring-green-600/20"
    : "bg-red-100 text-red-700 ring-1 ring-inset ring-red-600/20"
}

function getReasonClass(reason: string) {
  return reason === "ALLOWED"
    ? "bg-green-50 text-green-700"
    : "bg-red-50 text-red-700"
}

export default async function SecurityHistoryPage({ searchParams }: Props) {
  const params = await searchParams

  const period =
    params.period === "week" || params.period === "month"
      ? params.period
      : "today"

  const page = Math.max(Number.parseInt(params.page ?? "1", 10) || 1, 1)
  const pageSize = 10

  const result: "ALLOWED" | "DENIED" | undefined =
    params.result === "ALLOWED" || params.result === "DENIED"
      ? params.result
      : undefined

  const search = params.search?.trim() || undefined

  const { startDate, endDate } = getPeriodDates(period)

  const filterOptions = {
    startDate,
    endDate,
    result,
    search,
  }

  const [
    scanLogsResult,
    stats,
    equipmentUsage,
    employeeUsage,
    validationStats,
  ] = await Promise.all([
    listScanLogs({
      ...filterOptions,
      page,
      pageSize,
    }),

    getScanStats(filterOptions),
    getEquipmentUsage(filterOptions),
    getEmployeeUsage(filterOptions),
    getValidationStats(filterOptions),
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
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Administración · Sistemas
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Historial de salidas
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Consulta y analiza los registros generados durante la validación de
            equipos en Vigilancia.
          </p>
        </div>

        <Link
          href="/security"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          ← Ir a Vigilancia
        </Link>
      </div>

      {/* Estadísticas */}
      <HistoryStats
        total={stats.total}
        allowed={stats.allowed}
        denied={stats.denied}
        uniqueEquipment={stats.uniqueEquipment}
      />

      {/* Resultados de validación */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Resultados de validación
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Distribución de los motivos registrados para los filtros actuales.
          </p>
        </div>

        {validationStats.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            No existen validaciones para los filtros seleccionados.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {validationStats.map((item) => {
              const percentage =
                stats.total > 0
                  ? Math.round((item.count / stats.total) * 100)
                  : 0

              return (
                <div
                  key={item.reason}
                  className="flex flex-wrap items-center gap-4 px-5 py-4"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${getReasonClass(
                      item.reason,
                    )}`}
                  >
                    {item.reason === "ALLOWED" ? "✓" : "!"}
                  </div>

                  <div className="min-w-45 flex-1">
                    <p className="font-medium text-slate-800">
                      {validationReasonLabels[item.reason] ?? item.reason}
                    </p>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={
                          item.reason === "ALLOWED"
                            ? "h-full rounded-full bg-green-600"
                            : "h-full rounded-full bg-red-600"
                        }
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="ml-auto flex min-w-25 items-baseline justify-end gap-2">
                    <span className="text-xl font-bold text-slate-900">
                      {item.count}
                    </span>

                    <span className="text-sm text-slate-500">
                      {percentage}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Filtros */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>

          <p className="mt-1 text-sm text-slate-500">
            Refina los registros y estadísticas mostrados.
          </p>
        </div>

        <HistoryFilters period={period} result={result} search={search} />
      </section>
      {/* Tabla */}
      <section
        id="scan-results"
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Registros de escaneo
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {total === 0
                ? "No se encontraron registros."
                : `${total} registro${total === 1 ? "" : "s"} encontrado${
                    total === 1 ? "" : "s"
                  }.`}
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
            Página {page} de {Math.max(totalPages, 1)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-225 text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3 font-semibold">Fecha y hora</th>
                <th className="px-5 py-3 font-semibold">Equipo</th>
                <th className="px-5 py-3 font-semibold">Empleado</th>
                <th className="px-5 py-3 font-semibold">Empresa</th>
                <th className="px-5 py-3 font-semibold">Folio</th>
                <th className="px-5 py-3 font-semibold">Resultado</th>
                <th className="px-5 py-3 font-semibold">Motivo</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {scanLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No existen escaneos para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                scanLogs.map((scan) => (
                  <tr
                    key={scan.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {scan.scannedAt.toLocaleString("es-MX")}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {scan.assetTag ?? scan.permit?.equipment.assetTag ?? "—"}
                    </td>

                    <td className="px-5 py-4">
                      {scan.permit
                        ? `${scan.permit.employee.firstName} ${scan.permit.employee.lastName}`
                        : "—"}
                    </td>

                    <td className="px-5 py-4">
                      {scan.permit?.equipment.company ?? "—"}
                    </td>

                    <td className="px-5 py-4 font-medium">
                      {scan.permit?.folio ?? "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getResultClass(
                          scan.result,
                        )}`}
                      >
                        {getResultLabel(scan.result)}
                      </span>
                    </td>

                    <td className="max-w-xs px-5 py-4 text-slate-600">
                      {scan.notes ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-5 py-4">
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
                  }).toString()}#scan-results`}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-50"
                >
                  ← Anterior
                </Link>
              ) : (
                <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400">
                  ← Anterior
                </span>
              )}

              <span className="hidden px-2 text-sm text-slate-600 sm:block">
                {page} / {totalPages}
              </span>

              {page < totalPages ? (
                <Link
                  href={`/security/history?${new URLSearchParams({
                    ...(period ? { period } : {}),
                    ...(result ? { result } : {}),
                    ...(search ? { search } : {}),
                    page: String(page + 1),
                  }).toString()}#scan-results`}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-50"
                >
                  Siguiente →
                </Link>
              ) : (
                <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400">
                  Siguiente →
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Uso */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Uso de equipos */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Equipos con más salidas
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Salidas autorizadas durante el periodo seleccionado.
            </p>
          </div>

          {equipmentUsage.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No hay salidas autorizadas durante este periodo.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {equipmentUsage.map((item, index) => {
                const maxCount = equipmentUsage[0]?.count ?? 1

                const percentage = Math.max(
                  4,
                  Math.round((item.count / maxCount) * 100),
                )

                return (
                  <div
                    key={item.assetTag}
                    className="flex items-center gap-4 p-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800">
                            {item.assetTag}
                          </p>

                          <p className="truncate text-sm text-slate-500">
                            {item.employee}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xl font-bold text-blue-700">
                            {item.count}
                          </p>

                          <p className="text-xs text-slate-500">
                            {item.count === 1 ? "salida" : "salidas"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Uso por empleado */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Empleados con más salidas
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Salidas autorizadas registradas durante el periodo seleccionado.
            </p>
          </div>

          {employeeUsage.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No hay salidas autorizadas durante este periodo.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {employeeUsage.map((item, index) => {
                const maxCount = employeeUsage[0]?.count ?? 1

                const percentage = Math.max(
                  4,
                  Math.round((item.count / maxCount) * 100),
                )

                return (
                  <div
                    key={item.employeeId}
                    className="flex items-center gap-4 p-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <p className="truncate font-semibold text-slate-800">
                          {item.employee}
                        </p>

                        <div className="shrink-0 text-right">
                          <p className="text-xl font-bold text-blue-700">
                            {item.count}
                          </p>

                          <p className="text-xs text-slate-500">
                            {item.count === 1 ? "salida" : "salidas"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
