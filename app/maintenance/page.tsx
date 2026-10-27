import Card from "@/components/ui/Card"
import PageHeader from "@/components/ui/PageHeader"
import {
  listEligibleMaintenanceEquipment,
  listMaintenanceHistory,
} from "@/services/maintenance"

import MaintenanceRegistrationForm from "./registration-form"
import MaintenanceEquipmentPagination from "./equipment-pagination"
import MaintenanceHistoryPagination from "./history-pagination"
import MaintenanceHistorySearch from "./history-search"
import MaintenanceHistoryTable from "./maintenance-history-table"
import { requirePageRole } from "@/lib/auth/page-guard"

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    search?: string
    equipmentCompany?: string
    equipmentType?: string
    equipmentHistory?: string
    equipmentLastDate?: string
    historyPage?: string
    historySearch?: string
    historyFrom?: string
    historyTo?: string
    historyProvider?: string
  }>
}) {
  await requirePageRole("ADMIN", "IT")

  const {
    page,
    search,
    equipmentCompany,
    equipmentType,
    equipmentHistory,
    equipmentLastDate,
    historyPage,
    historySearch,
    historyFrom,
    historyTo,
    historyProvider,
  } = await searchParams
  const parsedPage = Number(page)
  const currentPage =
    Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const parsedHistoryPage = Number(historyPage)
  const currentHistoryPage =
    Number.isInteger(parsedHistoryPage) && parsedHistoryPage > 0
      ? parsedHistoryPage
      : 1
  const [result, history] = await Promise.all([
    listEligibleMaintenanceEquipment({
      page: currentPage,
      search,
      company: equipmentCompany,
      type: equipmentType,
      historyMode: equipmentHistory,
      lastMaintenanceBefore: equipmentLastDate,
    }),
    listMaintenanceHistory({
      page: currentHistoryPage,
      search: historySearch,
      from: historyFrom,
      to: historyTo,
      provider: historyProvider,
    }),
  ])
  const hasHistoryFilters = Boolean(
    historySearch?.trim() || historyFrom || historyTo || historyProvider,
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Mantenimientos" />

      <Card>
        <MaintenanceRegistrationForm
          equipment={result.data}
          page={result.page}
          search={search ?? ""}
          company={equipmentCompany ?? "all"}
          type={equipmentType ?? "all"}
          historyMode={equipmentHistory ?? "all"}
          lastMaintenanceBefore={equipmentLastDate ?? ""}
          filterError={result.filterError}
        />

        <MaintenanceEquipmentPagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          pageSize={result.pageSize}
        />
      </Card>

      <Card>
        <div className="mb-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Historial de mantenimientos
            </h2>
            <p className="text-sm text-slate-500">
              Registros ordenados por fecha efectiva, incluidos los históricos
              sin lote.
            </p>
          </div>
        </div>

        <MaintenanceHistorySearch
          providers={history.providers}
          error={history.filterError}
        />
        <MaintenanceHistoryTable
          records={history.data}
          emptyMessage={
            history.filterError
              ? "Corrige los filtros para consultar el historial."
              : hasHistoryFilters
              ? "No hay resultados para los filtros actuales."
              : "No hay mantenimientos registrados."
          }
        />
        <MaintenanceHistoryPagination
          page={history.page}
          totalPages={history.totalPages}
          total={history.total}
          pageSize={history.pageSize}
          search={historySearch}
          from={historyFrom}
          to={historyTo}
          provider={historyProvider}
          equipmentPage={page}
          equipmentSearch={search}
        />
      </Card>
    </div>
  )
}
