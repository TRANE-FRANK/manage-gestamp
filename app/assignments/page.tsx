import Link from "next/link"

import Card from "@/components/ui/Card"
import PageHeader from "@/components/ui/PageHeader"
import { DataTable } from "@/components/ui/data-table"
import Pagination from "@/components/ui/Pagination"
import SearchForm from "./search-form"

import { assignmentColumns } from "./assignment-columns"

import { listActiveAssignmentsPaginated } from "@/services/assignment"

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    page?: string
  }>
}) {
  const { search, page } = await searchParams

  const currentPage = Math.max(1, Number(page) || 1)

  const result = await listActiveAssignmentsPaginated({
    page: currentPage,
    pageSize: 5,
    search,
  })

  const assignments = result.data

  return (
    <>
      <PageHeader
        title="Asignaciones"
        actions={
          <>
            <Link
              href="/assignments/history"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Historial
            </Link>

            <Link
              href="/assignments/new"
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
            >
              Nueva Asignación
            </Link>
          </>
        }
      />

      <Card>
        <div className="mb-6 flex justify-end">
          <SearchForm />
        </div>

        <div className="overflow-x-auto">
          <DataTable
            columns={assignmentColumns}
            data={assignments}
            emptyMessage="No existen asignaciones activas."
          />
        </div>

        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          pageSize={result.pageSize}
          search={search}
        />
      </Card>
    </>
  )
}
