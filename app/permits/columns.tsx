"use client"

import Link from "next/link"
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

type PermitProcess =
  | "pending-generation"
  | "pending-signature"
  | "exception-authorized"
  | "complete"

/*
 * ESTADO GENERAL DEL PERMISO
 */

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

/*
 * ESTADO DEL PROCESO DEL PERMISO
 */

function getPermitProcess(permit: PermitRow): PermitProcess {
  // Todavía no se ha generado el formato
  if (!permit.generatedPdfPath) {
    return "pending-generation"
  }

  // Se autorizó una salida excepcional,
  // pero todavía falta cargar el documento firmado
  if (permit.departureAuthorized && !permit.signedPdfPath) {
    return "exception-authorized"
  }

  // Ya existe el formato, pero falta recibir las firmas
  if (!permit.signedPdfPath) {
    return "pending-signature"
  }

  // El documento firmado está cargado
  // y la salida fue autorizada
  if (permit.signedPdfPath && permit.departureAuthorized) {
    return "complete"
  }

  return "pending-signature"
}

function getPermitProcessLabel(process: PermitProcess) {
  switch (process) {
    case "pending-generation":
      return "Pendiente generar"

    case "pending-signature":
      return "Pendiente firmas"

    case "exception-authorized":
      return "Salida excepcional"

    case "complete":
      return "Completo"
  }
}

function getPermitProcessVariant(
  process: PermitProcess,
): "default" | "outline" | "secondary" | "destructive" {
  switch (process) {
    case "pending-generation":
      return "destructive"

    case "pending-signature":
      return "outline"

    case "exception-authorized":
      return "secondary"

    case "complete":
      return "default"
  }
}

/*
 * COLUMNAS
 */

export const permitColumns: ColumnDef<PermitRow>[] = [
  {
    accessorKey: "folio",

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Folio" />
    ),

    cell: ({ row }) => (
      <Link
        href={`/permits/${row.original.id}`}
        className="font-medium text-blue-700 transition hover:text-blue-900 hover:underline"
      >
        {row.original.folio}
      </Link>
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
    accessorFn: (row) =>
      row.equipment.assetTag ??
      row.equipment.serialNumber ??
      row.equipment.id.toString(),

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Equipo" />
    ),

    cell: ({ row }) => {
      const equipment = row.original.equipment

      const identifier =
        equipment.assetTag ??
        equipment.serialNumber ??
        `Equipo #${equipment.id}`

      return <span className="font-medium">{identifier}</span>
    },

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

  /*
   * PROCESO DEL PERMISO
   */

  {
    id: "process",

    accessorFn: (row) => getPermitProcess(row),

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Proceso" />
    ),

    cell: ({ row }) => {
      const process = getPermitProcess(row.original)

      return (
        <Badge variant={getPermitProcessVariant(process)}>
          {getPermitProcessLabel(process)}
        </Badge>
      )
    },

    meta: {
      title: "Proceso",
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
