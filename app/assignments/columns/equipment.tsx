"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { DataTableColumnHeader } from "@/components/ui/data-table/DataTableColumnHeader"

import type { AssignmentListItem } from "@/services/assignment"

export const equipmentColumn: ColumnDef<AssignmentListItem> = {
  id: "equipment",
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Equipo" />
  ),
  cell: ({ row }) => {
    const equipment = row.original.equipment

    const identifier =
      equipment.assetTag ??
      equipment.inventoryNumber ??
      equipment.serialNumber ??
      `Equipo #${equipment.id}`

    return <span className="font-medium">{identifier}</span>
  },
  meta: { title: "Equipo" },
}
