"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { DataTableColumnHeader } from "@/components/ui/data-table/DataTableColumnHeader"
import { formatDate } from "@/lib/format-date"

import type { AssignmentListItem } from "@/services/assignment"

export const assignedAtColumn: ColumnDef<AssignmentListItem> = {
  id: "assignedAt",
  accessorFn: (row) => row.assignedAt,
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Fecha" />
  ),
  cell: ({ row }) => formatDate(row.original.assignedAt),
  meta: { title: "Fecha" },
}
