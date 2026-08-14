import Link from "next/link"

import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"
import { DataTable } from "@/components/ui/data-table"
import { permitColumns } from "./columns"
import SearchForm from "./search-form"

import { getPermitDisplayStatus, listPermits } from "@/services/permit"

export default async function PermitsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string
    search?: string
  }>
}) {
  const { status, search } = await searchParams

  const permits = await listPermits()

  let filteredPermits = permits

  if (search) {
    const searchTerm = search.toLowerCase()

    filteredPermits = filteredPermits.filter(
      (permit) =>
        permit.folio.toLowerCase().includes(searchTerm) ||
        permit.equipment.assetTag.toLowerCase().includes(searchTerm) ||
        permit.employee.firstName.toLowerCase().includes(searchTerm) ||
        permit.employee.lastName.toLowerCase().includes(searchTerm),
    )
  }

  if (status === "active") {
    filteredPermits = filteredPermits.filter(
      (permit) =>
        permit.status === "ACTIVE" &&
        getPermitDisplayStatus(permit.expirationDate) === "active",
    )
  }

  if (status === "expiring") {
    filteredPermits = filteredPermits.filter(
      (permit) =>
        permit.status === "ACTIVE" &&
        getPermitDisplayStatus(permit.expirationDate) === "expiring",
    )
  }

  if (status === "expired") {
    filteredPermits = filteredPermits.filter(
      (permit) =>
        permit.status === "EXPIRED" ||
        (permit.status === "ACTIVE" &&
          getPermitDisplayStatus(permit.expirationDate) === "expired"),
    )
  }

  if (status === "cancelled") {
    filteredPermits = filteredPermits.filter(
      (permit) => permit.status === "CANCELLED",
    )
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
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Link
            href="/permits"
            className="rounded-lg bg-slate-600 px-4 py-2 text-white transition hover:bg-slate-700"
          >
            Todos
          </Link>

          <Link
            href="/permits?status=active"
            className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
          >
            Activos
          </Link>

          <Link
            href="/permits?status=expiring"
            className="rounded-lg bg-orange-500 px-4 py-2 text-white transition hover:bg-orange-600"
          >
            Por vencer
          </Link>

          <Link
            href="/permits?status=expired"
            className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
          >
            Expirados
          </Link>

          <Link
            href="/permits?status=cancelled"
            className="rounded-lg bg-slate-500 px-4 py-2 text-white transition hover:bg-slate-600"
          >
            Cancelados
          </Link>
          <div className="ml-auto">
            <SearchForm />
          </div>
        </div>

        <div className="overflow-x-auto">
          <DataTable
            columns={permitColumns}
            data={filteredPermits}
            toolbarPlaceholder="Buscar permiso..."
            emptyMessage="No existen permisos registrados."
          />
        </div>
      </Card>
    </>
  )
}
