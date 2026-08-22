"use client"

import Link from "next/link"

import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"

import { DataTableColumnHeader } from "@/components/ui/data-table/DataTableColumnHeader"

import type { Equipment } from "@/generated/prisma/client"

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
    cell: ({ row }) => (
      <Badge variant={row.original.type === "LAPTOP" ? "default" : "ghost"}>
        {row.original.type === "LAPTOP" ? "Laptop" : "Desktop"}
      </Badge>
    ),
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
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estado" />
    ),
    cell: ({ row }) => {
      const status = row.original.status

      const config = {
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
      } as const

      const statusConfig = config[status]

      return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
    },
    meta: {
      title: "Estado",
    },
  },
  {
    id: "details",

    header: "Detalles",

    cell: ({ row }) => (
      <Link
        href={`/equipment/${row.original.id}`}
        className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
      >
        Ver detalles
      </Link>
    ),

    enableSorting: false,

    meta: {
      title: "Detalles",
    },
  },
]
