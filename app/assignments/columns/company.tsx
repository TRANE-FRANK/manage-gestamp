"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/data-table/DataTableColumnHeader"

import type { AssignmentListItem } from "@/services/assignment"

export const companyColumn: ColumnDef<AssignmentListItem> = {
  id: "company",
  accessorFn: (row) => row.equipment.company,
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Empresa" />
  ),
  cell: ({ row }) => (
    <Badge
      variant={row.original.equipment.company === "ORM" ? "secondary" : "default"}
    >
      {row.original.equipment.company}
    </Badge>
  ),
  meta: { title: "Empresa" },
}
