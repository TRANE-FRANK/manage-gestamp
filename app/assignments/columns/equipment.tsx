"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { DataTableColumnHeader } from "@/components/ui/data-table/DataTableColumnHeader"

import type { AssignmentListItem } from "@/services/assignment"

export const equipmentColumn: ColumnDef<AssignmentListItem> = {
  accessorKey: "equipment.assetTag",
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Equipo" />
  ),
  cell: ({ row }) => (
    <span className="font-medium">{row.original.equipment.assetTag}</span>
  ),
  meta: { title: "Equipo" },
}
