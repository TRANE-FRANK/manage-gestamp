"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/data-table/DataTableColumnHeader"
import { permitActionsColumn } from "./Columns/actions"

import {
  calculateDaysRemaining,
  getPermitDisplayStatus,
} from "@/services/permit/utils"

import type { PermitDisplayStatus } from "@/services/permit/utils"

import type { PermitRow } from "./permit-table-types"

type PermitStatusDisplay = PermitDisplayStatus | "cancelled"

function getStatusLabel(status: PermitStatusDisplay) {
  switch (status) {
    case "active":
      return "Activo"

    case "expiring":
      return "Por vencer"

    case "expired":
      return "Expirado"

    case "cancelled":
      return "Cancelado"
  }
}

function getStatusVariant(
  status: PermitStatusDisplay,
): "default" | "outline" | "destructive" | "secondary" {
  switch (status) {
    case "active":
      return "default"

    case "expiring":
      return "outline"

    case "expired":
      return "destructive"

    case "cancelled":
      return "secondary"
  }
}

export const permitColumns: ColumnDef<PermitRow>[] = [
  {
    accessorKey: "folio",

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Folio" />
    ),

    cell: ({ row }) => (
      <span className="font-medium">{row.original.folio}</span>
    ),

    meta: {
      title: "Folio",
    },
  },

  {
    id: "employee",

    accessorFn: (row) => `${row.employee.firstName} ${row.employee.lastName}`,

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Usuario" />
    ),

    cell: ({ row }) => (
      <span>
        {row.original.employee.firstName} {row.original.employee.lastName}
      </span>
    ),

    meta: {
      title: "Usuario",
    },
  },

  {
    id: "company",

    accessorFn: (row) => row.equipment.company,

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Empresa" />
    ),

    cell: ({ row }) => (
      <Badge
        variant={
          row.original.equipment.company === "ORM" ? "secondary" : "default"
        }
      >
        {row.original.equipment.company}
      </Badge>
    ),

    meta: {
      title: "Empresa",
    },
  },

  {
    id: "equipment",

    accessorFn: (row) => row.equipment.assetTag,

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Equipo" />
    ),

    cell: ({ row }) => (
      <span className="font-medium">{row.original.equipment.assetTag}</span>
    ),

    meta: {
      title: "Equipo",
    },
  },

  {
    id: "expirationDate",

    accessorFn: (row) => row.expirationDate,

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Expiración" />
    ),

    cell: ({ row }) => row.original.expirationDate.toLocaleDateString("es-MX"),

    meta: {
      title: "Expiración",
    },
  },

  {
    id: "status",

    accessorFn: (row) =>
      row.status === "CANCELLED"
        ? "cancelled"
        : getPermitDisplayStatus(row.expirationDate),

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estado" />
    ),

    cell: ({ row }) => {
      const permit = row.original

      const status: PermitStatusDisplay =
        permit.status === "CANCELLED"
          ? "cancelled"
          : getPermitDisplayStatus(permit.expirationDate)

      return (
        <Badge variant={getStatusVariant(status)}>
          {getStatusLabel(status)}
        </Badge>
      )
    },

    meta: {
      title: "Estado",
    },
  },

  {
    id: "daysRemaining",

    accessorFn: (row) => {
      if (row.status === "CANCELLED") {
        return null
      }

      return calculateDaysRemaining(row.expirationDate)
    },

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Días restantes" />
    ),

    cell: ({ row }) => {
      const permit = row.original

      if (permit.status === "CANCELLED") {
        return <span className="text-slate-400">—</span>
      }

      const daysLeft = calculateDaysRemaining(permit.expirationDate)

      if (daysLeft < 0) {
        return <span>Vencido hace {Math.abs(daysLeft)} días</span>
      }

      return <span>{daysLeft} días</span>
    },

    meta: {
      title: "Días restantes",
    },
  },

  {
    id: "signedPdf",

    accessorFn: (row) => row.signedPdfPath,

    header: "PDF firmado",

    enableSorting: false,

    cell: ({ row }) =>
      row.original.signedPdfPath ? (
        <Badge variant="default">Sí</Badge>
      ) : (
        <Badge variant="outline">Pendiente</Badge>
      ),

    meta: {
      title: "PDF firmado",
    },
  },

  permitActionsColumn,
]
