"use client"

import type { ColumnDef } from "@tanstack/react-table"

import AssignmentStatus from "@/components/assignment/AssignmentStatus"
import { DataTableColumnHeader } from "@/components/ui/data-table/DataTableColumnHeader"

import type { AssignmentListItem } from "@/services/assignment"

export const statusColumn: ColumnDef<AssignmentListItem> = {
  id: "status",
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Estado" />
  ),
  cell: ({ row }) => (
    <AssignmentStatus
      generatedPdfPath={row.original.generatedPdfPath}
      signedPdfPath={row.original.signedPdfPath}
    />
  ),
  meta: { title: "Estado" },
}
