"use client"

import Link from "next/link"

import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"

import { equipmentTypeConfig } from "@/lib/equipment/config"

import { DataTableColumnHeader } from "@/components/ui/data-table/DataTableColumnHeader"

import type {
  Equipment,
  EquipmentOwnership,
  EquipmentStatus,
} from "@/generated/prisma/client"

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost"

const equipmentTypeVariant: Record<
  Exclude<Equipment["type"], null>,
  BadgeVariant
> = {
  LAPTOP: "default",
  DESKTOP: "secondary",
  SMARTPHONE: "outline",
  TABLET: "ghost",
  RADIO: "secondary",
  PRINTER: "outline",
}

const ownershipConfig: Record<
  EquipmentOwnership,
  {
    label: string
    variant: BadgeVariant
  }
> = {
  OWNED: {
    label: "Propio",
    variant: "default",
  },
  RENTED: {
    label: "Rentado",
    variant: "secondary",
  },
}

const statusConfig: Record<
  EquipmentStatus,
  {
    label: string
    variant: BadgeVariant
  }
> = {
  AVAILABLE: {
    label: "Disponible",
    variant: "default",
  },
  ASSIGNED: {
    label: "Asignado",
    variant: "destructive",
  },
  MAINTENANCE: {
    label: "Reparación",
    variant: "outline",
  },
  STORAGE: {
    label: "Almacén",
    variant: "secondary",
  },
  RETIRED: {
    label: "Retirado",
    variant: "secondary",
  },
}

export const equipmentColumns: ColumnDef<Equipment>[] = [
  {
    accessorKey: "assetTag",

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Equipo" />
    ),

    cell: ({ row }) => {
      const equipment = row.original
      const identifier =
        equipment.assetTag ??
        equipment.inventoryNumber ??
        equipment.serialNumber ??
        `Equipo #${equipment.id}`

      return <span className="font-medium">{identifier}</span>
    },

    meta: {
      title: "Equipo",
    },
  },

  {
    accessorKey: "type",

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo" />
    ),

    cell: ({ row }) => {
      const type = row.original.type

      if (!type) {
        return <span className="text-slate-400">—</span>
      }

      const config = equipmentTypeConfig[type]
      return <Badge variant={equipmentTypeVariant[type]}>{config.label}</Badge>
    },

    meta: {
      title: "Tipo",
    },
  },

  {
    accessorKey: "brand",

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Marca" />
    ),

    cell: ({ row }) => <span>{row.original.brand ?? "-"}</span>,

    meta: {
      title: "Marca",
    },
  },

  {
    accessorKey: "model",

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Modelo" />
    ),

    cell: ({ row }) => <span>{row.original.model ?? "-"}</span>,

    meta: {
      title: "Modelo",
    },
  },

  {
    accessorKey: "serialNumber",

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Serial" />
    ),

    cell: ({ row }) => <span>{row.original.serialNumber ?? "-"}</span>,

    meta: {
      title: "Serial",
    },
  },

  {
    accessorKey: "company",

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Empresa" />
    ),

    cell: ({ row }) => (
      <Badge variant={row.original.company === "ORM" ? "default" : "ghost"}>
        {row.original.company}
      </Badge>
    ),

    meta: {
      title: "Empresa",
    },
  },

  {
    accessorKey: "ownership",

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Propiedad" />
    ),

    cell: ({ row }) => {
      const ownership = row.original.ownership

      if (!ownership) {
        return <span className="text-slate-400">—</span>
      }

      const config = ownershipConfig[ownership]

      if (!config) {
        return <span className="text-slate-400">—</span>
      }

      return <Badge variant={config.variant}>{config.label}</Badge>
    },

    meta: {
      title: "Propiedad",
    },
  },

  {
    accessorKey: "warrantyExpiresAt",

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Garantía" />
    ),

    cell: ({ row }) => {
      const equipment = row.original
      const hasWarranty =
        equipment.type !== null &&
        equipmentTypeConfig[equipment.type].hasWarranty

      if (!hasWarranty || !equipment.warrantyExpiresAt) {
        return <span className="text-slate-400">—</span>
      }

      return (
        <span>
          {new Intl.DateTimeFormat("es-MX", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }).format(equipment.warrantyExpiresAt)}
        </span>
      )
    },

    meta: {
      title: "Garantía",
    },
  },

  {
    accessorKey: "status",

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estado" />
    ),

    cell: ({ row }) => {
      const status = row.original.status

      const config = statusConfig[status]

      return <Badge variant={config.variant}>{config.label}</Badge>
    },

    meta: {
      title: "Estado",
    },
  },

  {
    id: "actions",
    header: "Acciones",
    enableSorting: false,
    enableHiding: false,

    cell: ({ row }) => {
      const equipmentId = row.original.id

      return (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/equipment/${equipmentId}`}
            className="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Ver
          </Link>

          <Link
            href={`/equipment/${equipmentId}/edit`}
            className="inline-flex h-8 items-center justify-center rounded-md bg-blue-700 px-3 text-sm font-medium text-white transition hover:bg-blue-800"
          >
            Editar
          </Link>
        </div>
      )
    },

    meta: {
      title: "Acciones",
    },
  },
]
