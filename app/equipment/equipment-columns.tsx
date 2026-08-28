"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"

import { DataTableColumnHeader } from "@/components/ui/data-table/DataTableColumnHeader"

import type {
  Equipment,
  EquipmentOwnership,
  EquipmentStatus,
  EquipmentType,
} from "@/generated/prisma/client"

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost"

const equipmentTypeConfig: Record<
  EquipmentType,
  {
    label: string
    variant: BadgeVariant
  }
> = {
  LAPTOP: {
    label: "Laptop",
    variant: "default",
  },
  DESKTOP: {
    label: "Desktop",
    variant: "secondary",
  },
  SMARTPHONE: {
    label: "Smartphone",
    variant: "outline",
  },
  TABLET: {
    label: "Tablet",
    variant: "ghost",
  },
  RADIO: {
    label: "Radio",
    variant: "secondary",
  },
  PRINTER: {
    label: "Impresora",
    variant: "outline",
  },
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

    cell: ({ row }) => (
      <span className="font-medium">{row.original.assetTag}</span>
    ),

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

      return <Badge variant={config.variant}>{config.label}</Badge>
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
      const date = row.original.warrantyExpiresAt

      if (!date) {
        return <span className="text-slate-400">—</span>
      }

      return (
        <span>
          {new Intl.DateTimeFormat("es-MX", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }).format(date)}
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
]
