import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"
import { DataTable } from "@/components/ui/data-table"
import Pagination from "@/components/ui/Pagination"
import SearchForm from "./search-form"

import { assignmentHistoryColumns } from "@/app/assignments/history-columns"

import { listAssignmentHistoryPaginated } from "@/services/assignment"

export default async function AssignmentHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    page?: string
  }>
}) {
  const { search, page } = await searchParams

  const currentPage = Math.max(1, Number(page) || 1)

  const result = await listAssignmentHistoryPaginated({
    page: currentPage,
    pageSize: 10,
    search,
  })

  const assignments = result.data

  return (
    <>
      <PageHeader title="Historial de asignaciones" />

      <Card>
        <div className="mb-4 flex justify-end">
          <SearchForm />
        </div>
        <div className="overflow-x-auto">
          <DataTable
            columns={assignmentHistoryColumns}
            data={assignments}
            emptyMessage="No existen asignaciones registradas en el historial."
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
