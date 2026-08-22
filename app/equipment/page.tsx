import Link from "next/link"

import type {
  Company,
  EquipmentStatus,
  EquipmentType,
} from "@/generated/prisma/client"

import Card from "@/components/ui/Card"
import PageHeader from "@/components/ui/PageHeader"
import { DataTable } from "@/components/ui/data-table"
import Pagination from "@/components/ui/Pagination"
import EquipmentSearchForm from "./search-form"
import EquipmentFilters from "./filters"

import { listEquipmentPaginated } from "@/services/equipment"

import EquipmentToast from "./equipment-toast"
import { equipmentColumns } from "./equipment-columns"

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    search?: string
    company?: string
    status?: string
    type?: string
  }>
}) {
  function isCompany(value: string | undefined): value is Company {
    return value === "ORM" || value === "GP2"
  }

  function isEquipmentStatus(
    value: string | undefined,
  ): value is EquipmentStatus {
    return (
      value === "AVAILABLE" ||
      value === "ASSIGNED" ||
      value === "MAINTENANCE" ||
      value === "STORAGE" ||
      value === "RETIRED"
    )
  }

  function isEquipmentType(value: string | undefined): value is EquipmentType {
    return value === "LAPTOP" || value === "DESKTOP"
  }

  const { page, search, company, status, type } = await searchParams

  const validCompany = isCompany(company) ? company : undefined

  const validStatus = isEquipmentStatus(status) ? status : undefined

  const validType = isEquipmentType(type) ? type : undefined

  const currentPage = Math.max(1, Number(page) || 1)

  const result = await listEquipmentPaginated({
    page: currentPage,
    pageSize: 5,
    search,
    company: validCompany,
    status: validStatus,
    type: validType,
  })

  return (
    <>
      <PageHeader
        title="Equipos"
        actions={
          <Link
            href="/equipment/new"
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
          >
            Nuevo Equipo
          </Link>
        }
      />

      <Card>
        <div className="mb-6">
          <EquipmentSearchForm />
        </div>

        <div className="mb-6">
          <EquipmentFilters />
        </div>

        <DataTable
          columns={equipmentColumns}
          data={result.data}
          emptyMessage="No hay equipos registrados."
        />

        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          pageSize={result.pageSize}
          search={search}
        />
      </Card>

      <EquipmentToast />
    </>
  )
}
