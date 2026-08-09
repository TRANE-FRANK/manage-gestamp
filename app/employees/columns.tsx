"use client"

import type { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/data-table/DataTableColumnHeader"

import type { Employee } from "@/generated/prisma/client"

export const employeeColumns: ColumnDef<Employee>[] = [
  {
    id: "sapNumber",
    accessorKey: "sapNumber",
    header: ({ column }) => <DataTableColumnHeader column={column} title="SAP" />,
    meta: { title: "SAP" },
  },
  {
    id: "name",
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
    cell: ({ row }) => (
      <Link
        href={`/employees/${row.original.id}`}
        className="font-medium text-slate-800 transition hover:text-blue-700"
      >
        {row.original.firstName} {row.original.lastName}
      </Link>
    ),
    meta: { title: "Nombre" },
  },
  {
    accessorKey: "department",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Departamento" />,
    cell: ({ row }) => row.original.department || "-",
    meta: { title: "Departamento" },
  },
  {
    accessorKey: "position",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Posición" />,
    cell: ({ row }) => row.original.position || "-",
    meta: { title: "Posición" },
  },
  {
    id: "company",
    accessorKey: "company",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Empresa" />,
    cell: ({ row }) => (
      <Badge variant={row.original.company === "ORM" ? "secondary" : "default"}>
        {row.original.company}
      </Badge>
    ),
    meta: { title: "Empresa" },
  },
]
