import Link from "next/link"

import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"
import { DataTable } from "@/components/ui/data-table"
import Pagination from "@/components/ui/Pagination"

import { permitColumns } from "./columns"

import { listPermitsPaginated } from "@/services/permit"

import type { PermitProcess } from "@/services/permit/types"

export default async function PermitsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string
    process?: string
    search?: string
    page?: string
  }>
}) {
  function isPermitProcess(value: string | undefined): value is PermitProcess {
    return (
      value === "pending-generation" ||
      value === "pending-signature" ||
      value === "exception-authorized" ||
      value === "complete"
    )
  }

  const { status, process, search, page } = await searchParams

  const validProcess = isPermitProcess(process) ? process : undefined
  function buildFilterUrl({
    status: nextStatus,
    process: nextProcess,
  }: {
    status?: string
    process?: PermitProcess
  }) {
    const params = new URLSearchParams()

    if (nextStatus) {
      params.set("status", nextStatus)
    }

    if (nextProcess) {
      params.set("process", nextProcess)
    }

    if (search) {
      params.set("search", search)
    }

    const query = params.toString()

    return query ? `/permits?${query}` : "/permits"
  }

  const currentPage = Math.max(1, Number(page) || 1)

  const result = await listPermitsPaginated({
    page: currentPage,
    pageSize: 5,
    status,
    process: validProcess,
    search,
  })

  const permits = result.data

  const activeFilters: string[] = []

  switch (status) {
    case "active":
      activeFilters.push("Activos")
      break
    case "expiring":
      activeFilters.push("Por vencer")
      break
    case "expired":
      activeFilters.push("Expirados")
      break
    case "cancelled":
      activeFilters.push("Cancelados")
      break
  }

  switch (validProcess) {
    case "pending-generation":
      activeFilters.push("Pendiente generar")
      break
    case "pending-signature":
      activeFilters.push("Pendiente firmas")
      break
    case "exception-authorized":
      activeFilters.push("Salida excepcional")
      break
    case "complete":
      activeFilters.push("Completos")
      break
  }

  return (
    <>
      <PageHeader
        title="Permisos"
        actions={
          <Link
            href="/permits/new"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Nuevo permiso
          </Link>
        }
      />

      <Card>
        <div className="mb-6 space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">
              Estado del permiso
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={buildFilterUrl({
                  process: validProcess,
                })}
                className={`rounded-lg px-4 py-2 transition ${
                  !status
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Todos
              </Link>

              <Link
                href={buildFilterUrl({
                  status: "active",
                  process: validProcess,
                })}
                className={`rounded-lg px-4 py-2 transition ${
                  status === "active"
                    ? "bg-green-600 text-white"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                Activos
              </Link>

              <Link
                href={buildFilterUrl({
                  status: "expiring",
                  process: validProcess,
                })}
                className={`rounded-lg px-4 py-2 transition ${
                  status === "expiring"
                    ? "bg-orange-500 text-white"
                    : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                }`}
              >
                Por vencer
              </Link>

              <Link
                href={buildFilterUrl({
                  status: "expired",
                  process: validProcess,
                })}
                className={`rounded-lg px-4 py-2 transition ${
                  status === "expired"
                    ? "bg-red-600 text-white"
                    : "bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                Expirados
              </Link>

              <Link
                href={buildFilterUrl({
                  status: "cancelled",
                  process: validProcess,
                })}
                className={`rounded-lg px-4 py-2 transition ${
                  status === "cancelled"
                    ? "bg-slate-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Cancelados
              </Link>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Proceso</p>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={buildFilterUrl({
                  status,
                  process: "pending-generation",
                })}
                className={`rounded-lg border px-4 py-2 transition ${
                  validProcess === "pending-generation"
                    ? "border-red-600 bg-red-600 text-white"
                    : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                Pendiente generar
              </Link>

              <Link
                href={buildFilterUrl({
                  status,
                  process: "pending-signature",
                })}
                className={`rounded-lg border px-4 py-2 transition ${
                  validProcess === "pending-signature"
                    ? "border-orange-500 bg-orange-500 text-white"
                    : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                }`}
              >
                Pendiente firmas
              </Link>

              <Link
                href={buildFilterUrl({
                  status,
                  process: "exception-authorized",
                })}
                className={`rounded-lg border px-4 py-2 transition ${
                  validProcess === "exception-authorized"
                    ? "border-yellow-500 bg-yellow-500 text-white"
                    : "border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                }`}
              >
                Salida excepcional
              </Link>

              <Link
                href={buildFilterUrl({
                  status,
                  process: "complete",
                })}
                className={`rounded-lg border px-4 py-2 transition ${
                  validProcess === "complete"
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                Completos
              </Link>

              <Link
                href={buildFilterUrl({
                  status,
                })}
                className={`rounded-lg px-4 py-2 transition ${
                  !validProcess
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Todos
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
          <div className="text-slate-600">
            Mostrando{" "}
            <span className="font-semibold text-slate-900">
              {permits.length}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-slate-900">{result.total}</span>{" "}
            permisos
          </div>

          {(activeFilters.length > 0 || search) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500">Filtros activos:</span>

              {activeFilters.map((filter) => (
                <span
                  key={filter}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm"
                >
                  {filter}
                </span>
              ))}

              {search && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  Búsqueda: {search}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <DataTable
            columns={permitColumns}
            data={permits}
            emptyMessage="No existen permisos registrados."
          />
        </div>
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          pageSize={result.pageSize}
          search={search}
          status={status}
          process={validProcess}
        />
      </Card>
    </>
  )
}
